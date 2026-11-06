import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { url } = await req.json();
    if (!url || typeof url !== "string" || url.length > 2000) {
      throw new Error("Invalid URL input");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a cybersecurity expert analyzing URLs for phishing and malicious indicators. Analyze the given URL and respond with a JSON object using this exact tool call.`,
          },
          {
            role: "user",
            content: `Analyze this URL for phishing/malicious indicators: ${url}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_url_analysis",
              description: "Report the URL phishing analysis results",
              parameters: {
                type: "object",
                properties: {
                  risk_score: { type: "number", description: "Risk score 0-100, where 0 is safe and 100 is definitely phishing" },
                  classification: { type: "string", enum: ["safe", "suspicious", "phishing"], description: "Overall classification" },
                  reasons: { type: "array", items: { type: "string" }, description: "List of specific findings" },
                  details: { type: "string", description: "Detailed analysis explanation" },
                },
                required: ["risk_score", "classification", "reasons", "details"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_url_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { risk_score: 50, classification: "suspicious", reasons: ["Unable to fully analyze"], details: "Analysis incomplete" };

    // Save scan to database
    await supabase.from("scans").insert({
      user_id: user.id,
      scan_type: "url",
      input: url,
      result,
      risk_score: result.risk_score,
      classification: result.classification,
    });

    // Create alert if threat detected
    if (result.classification !== "safe") {
      const severity = result.risk_score >= 80 ? "critical" : result.risk_score >= 60 ? "high" : result.risk_score >= 40 ? "medium" : "low";
      await supabase.from("alerts").insert({
        user_id: user.id,
        alert_type: "url",
        severity,
        title: `${result.classification.toUpperCase()} URL detected`,
        description: url,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-url error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
