import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "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";

interface LessonRequest {
  subject: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { subject, topic, difficulty = 'beginner' }: LessonRequest = await req.json();

    if (!subject || !topic) {
      return new Response(
        JSON.stringify({ error: "Subject and topic are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Generate a comprehensive lesson on "${topic}" for the subject "${subject}" at ${difficulty} level.

Return a JSON object with this exact structure:
{
  "title": "Lesson Title",
  "description": "Brief description of the lesson",
  "objectives": ["Learning objective 1", "Learning objective 2", "Learning objective 3"],
  "simple_explanation": "A simple, easy-to-understand explanation of the topic (2-3 paragraphs)",
  "detailed_explanation": "An in-depth explanation covering all important aspects (4-5 paragraphs)",
  "examples": [
    {"title": "Example 1 Title", "content": "Example 1 content with real-world application"},
    {"title": "Example 2 Title", "content": "Example 2 content"},
    {"title": "Example 3 Title", "content": "Example 3 content"}
  ],
  "common_mistakes": ["Common mistake 1", "Common mistake 2", "Common mistake 3"],
  "memory_tips": ["Memory tip 1", "Memory tip 2", "Memory tip 3"],
  "practice_questions": [
    {"question": "Practice question 1", "answer": "Answer with explanation"},
    {"question": "Practice question 2", "answer": "Answer with explanation"},
    {"question": "Practice question 3", "answer": "Answer with explanation"},
    {"question": "Practice question 4", "answer": "Answer with explanation"},
    {"question": "Practice question 5", "answer": "Answer with explanation"}
  ],
  "summary": "A concise summary of the key points covered in this lesson"
}

Make the content educational, engaging, and appropriate for the ${difficulty} level. Use real-world examples that students can relate to.`;

    // Call Groq API for lesson generation
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator. Generate comprehensive, engaging lessons in JSON format. Always return valid JSON only, no markdown formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    let lessonContent = data.choices?.[0]?.message?.content || "";

    // Clean up the response - remove markdown code blocks if present
    lessonContent = lessonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON
    let lesson;
    try {
      lesson = JSON.parse(lessonContent);
    } catch (e) {
      console.error("Failed to parse lesson JSON:", lessonContent);
      throw new Error("Failed to parse generated lesson");
    }

    return new Response(
      JSON.stringify({
        success: true,
        lesson: {
          ...lesson,
          generated_at: new Date().toISOString(),
          difficulty,
          estimated_minutes: 15 + (difficulty === 'advanced' ? 10 : difficulty === 'intermediate' ? 5 : 0)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in lesson generator function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
