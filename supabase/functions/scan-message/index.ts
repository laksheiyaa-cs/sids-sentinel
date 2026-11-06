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

    const { message } = await req.json();
    if (!message || typeof message !== "string" || message.length > 5000 || message.length < 10) {
      throw new Error("Invalid message input (10-5000 chars)");
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
            content: `You are a cybersecurity expert analyzing messages for scam, phishing, and social engineering indicators. Analyze the given message content.`,
          },
          {
            role: "user",
            content: `Analyze this message for scam/phishing indicators:\n\n${message}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_message_analysis",
              description: "Report the message scam analysis results",
              parameters: {
                type: "object",
                properties: {
                  risk_score: { type: "number", description: "Risk score 0-100" },
                  classification: { type: "string", enum: ["safe", "suspicious", "scam"], description: "Classification" },
                  patterns: { type: "array", items: { type: "string" }, description: "Detected scam patterns" },
                  details: { type: "string", description: "Detailed analysis" },
                  confidence: { type: "number", description: "Confidence percentage 0-100" },
                },
                required: ["risk_score", "classification", "patterns", "details", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_message_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { risk_score: 50, classification: "suspicious", patterns: [], details: "Analysis incomplete", confidence: 50 };

    await supabase.from("scans").insert({
      user_id: user.id,
      scan_type: "message",
      input: message.substring(0, 500),
      result,
      risk_score: result.risk_score,
      classification: result.classification,
    });

    if (result.classification !== "safe") {
      const severity = result.risk_score >= 80 ? "critical" : result.risk_score >= 60 ? "high" : result.risk_score >= 40 ? "medium" : "low";
      await supabase.from("alerts").insert({
        user_id: user.id,
        alert_type: "message",
        severity,
        title: `${result.classification.toUpperCase()} message detected`,
        description: message.substring(0, 200),
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-message error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
