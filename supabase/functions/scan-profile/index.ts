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

    const { name, bio, description } = await req.json();
    if (!name || !description || typeof name !== "string" || typeof description !== "string") {
      throw new Error("Name and description are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const profileText = `Name: ${name}\nBio: ${bio || "N/A"}\nDescription: ${description}`;

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
            content: `You are a cybersecurity expert specializing in detecting fake profiles, synthetic identities, and bot accounts. Analyze the given profile data for signs of fake or synthetic identity.`,
          },
          {
            role: "user",
            content: `Analyze this profile for fake/synthetic identity indicators:\n\n${profileText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_profile_analysis",
              description: "Report the profile authenticity analysis results",
              parameters: {
                type: "object",
                properties: {
                  risk_score: { type: "number", description: "Risk score 0-100" },
                  classification: { type: "string", enum: ["legitimate", "suspicious", "fake"], description: "Classification" },
                  findings: { type: "array", items: { type: "string" }, description: "Specific findings" },
                  details: { type: "string", description: "Detailed analysis" },
                },
                required: ["risk_score", "classification", "findings", "details"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_profile_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { risk_score: 50, classification: "suspicious", findings: [], details: "Analysis incomplete" };

    await supabase.from("scans").insert({
      user_id: user.id,
      scan_type: "profile",
      input: profileText.substring(0, 500),
      result,
      risk_score: result.risk_score,
      classification: result.classification,
    });

    if (result.classification !== "legitimate") {
      const severity = result.risk_score >= 80 ? "critical" : result.risk_score >= 60 ? "high" : result.risk_score >= 40 ? "medium" : "low";
      await supabase.from("alerts").insert({
        user_id: user.id,
        alert_type: "profile",
        severity,
        title: `${result.classification.toUpperCase()} profile detected`,
        description: `Profile: ${name}`,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-profile error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
