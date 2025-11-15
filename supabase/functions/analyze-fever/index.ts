/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientData } = await req.json();
    console.log('Analyzing patient data:', patientData);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured for analyze-fever function");
    }

  const model = Deno.env.get("GEMINI_MODEL") ?? "models/gemini-flash-latest";

    const prompt = `You are a medical AI assistant helping patients understand fever recovery.
Analyze the following patient data and provide clinical decision support.
IMPORTANT: Always recommend consulting a doctor for final decisions.
Never provide definitive medical advice. Provide evidence-based guidance only.

Respond ONLY with valid JSON (no markdown, no code blocks, no extra text) using this schema:
{
  "decision": "CONTINUE" | "CONSULT_DOCTOR" | "LIKELY_SAFE_TO_STOP",
  "recovery_probability": number,
  "confidence": number,
  "explanation": string,
  "key_factors": string[],
  "risk_assessment": "LOW" | "MEDIUM" | "HIGH",
  "next_steps": string[],
  "warning_signs": string[],
  "doctor_note": string
}

Patient Assessment:
- Age: ${patientData.age} years
- Temperature: ${patientData.temperature}°C
- Fever Duration: ${patientData.duration} days
- Medication: ${patientData.medicationType}
- Days on medication: ${patientData.daysOnMedication}
- Compliance: ${patientData.compliance}%
- Symptoms: ${patientData.symptoms.join(', ')}
- Comorbidities: ${patientData.comorbidities.join(', ') || 'None'}
- Location: ${patientData.location}`;

    console.log("Calling Gemini model:", model);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Gemini rate limit exceeded. Please try again shortly." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text?.trim();

    if (!rawText) {
      console.error("Gemini response missing text", data);
      throw new Error("Gemini response missing content");
    }

    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Gemini JSON parse error", parseError, cleaned);
      throw new Error("Failed to parse Gemini response as JSON");
    }

    return new Response(JSON.stringify(aiAnalysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error in analyze-fever function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
