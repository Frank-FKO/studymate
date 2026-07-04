import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "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";

// Available voices from Groq Orpheus
const AVAILABLE_VOICES = ['autumn', 'ember', 'luna', 'nova', 'sky', 'stella'];

interface TTSRequest {
  text: string;
  voice?: string;
  response_format?: 'wav' | 'mp3';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, voice = 'autumn', response_format = 'wav' }: TTSRequest = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate voice
    const selectedVoice = AVAILABLE_VOICES.includes(voice) ? voice : 'autumn';

    // Limit text length for API
    const maxLength = 4000;
    const truncatedText = text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;

    console.log(`Generating speech for text (${truncatedText.length} chars) with voice: ${selectedVoice}`);

    // Call Groq's Orpheus TTS API
    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        voice: selectedVoice,
        response_format: response_format,
        input: truncatedText,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq TTS API error:", errorText);

      // If TTS fails, return a helpful message
      return new Response(
        JSON.stringify({
          error: "TTS service temporarily unavailable",
          fallback: true,
          message: "Text-to-speech is currently unavailable. Please try again later."
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the audio data as ArrayBuffer
    const audioData = await response.arrayBuffer();

    // Return the audio file with appropriate content type
    const contentType = response_format === 'mp3' ? 'audio/mpeg' : 'audio/wav';

    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Length": audioData.byteLength.toString(),
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error("Error in TTS function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
