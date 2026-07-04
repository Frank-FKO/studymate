import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "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";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface LearningContext {
  memory?: {
    mastered_topics: string[];
    struggling_topics: string[];
    current_level: number;
    current_streak: number;
    preferred_explanation_style: string;
    learning_speed: string;
    confidence_level: number;
    frequent_mistakes: { topic: string; mistake: string; count: number }[];
  };
  subjects?: { subject_id: string; mastery_percentage: number; lessons_completed: number }[];
  recent_activities?: { activity_type: string; description: string; created_at: string }[];
  quiz_attempts?: { score: number; total_questions: number; strengths: string[]; weaknesses: string[] }[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, context, userId, supabaseUrl, supabaseKey } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch learning context if userId provided
    let learningContext: LearningContext | null = null;
    if (userId && supabaseUrl && supabaseKey) {
      try {
        const contextResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_learning_context`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ user_uuid: userId }),
        });

        if (contextResponse.ok) {
          learningContext = await contextResponse.json();
        }
      } catch (e) {
        console.log("Could not fetch learning context:", e);
      }
    }

    // Build personalized system prompt
    const systemPrompt = buildPersonalizedPrompt(learningContext, context);

    // Prepare messages for Groq API
    const groqMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }))
    ];

    // Call Groq API with Llama 4
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    let assistantMessage = data.choices?.[0]?.message?.content || "";

    // Add structured ending if this is an explanation
    if (shouldAddStructuredEnding(messages)) {
      assistantMessage = appendLearningElements(assistantMessage, context);
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        model: data.model,
        usage: data.usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in AI tutor function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPersonalizedPrompt(context: LearningContext | null, roomContext?: string): string {
  let prompt = `You are Cortex AI, an intelligent and personalized tutor. Your role is to help students learn through clear explanations, engaging questions, and adaptive teaching.

CORE PRINCIPLES:
- Always be encouraging and patient
- Adapt your explanations to the student's level
- Use examples relevant to real life
- Break down complex topics into simple parts
- Ask check-up questions to verify understanding
- Celebrate progress and learning
- Never give up on a student

`;

  if (context?.memory) {
    const { memory } = context;

    // Add personalization based on learning profile
    prompt += `STUDENT PROFILE:
- Current Level: ${memory.current_level}
- Study Streak: ${memory.current_streak} days
- Confidence Level: ${memory.confidence_level}%
- Learning Speed: ${memory.learning_speed}
- Preferred Explanation Style: ${memory.preferred_explanation_style}

`;

    // Add mastered topics
    if (memory.mastered_topics?.length > 0) {
      prompt += `MASTERED TOPICS: The student has already mastered: ${memory.mastered_topics.join(", ")}.
You can reference these topics when explaining new concepts.

`;
    }

    // Add struggling topics
    if (memory.struggling_topics?.length > 0) {
      prompt += `STRUGGLING TOPICS: The student needs help with: ${memory.struggling_topics.join(", ")}.
When covering related topics, provide extra explanation and simpler examples.
Be patient and use multiple approaches to explain these concepts.

`;
    }

    // Add frequent mistakes
    if (memory.frequent_mistakes?.length > 0) {
      prompt += `FREQUENT MISTAKES TO WATCH FOR:
${memory.frequent_mistakes.map(m => `- ${m.topic}: ${m.mistake} (made ${m.count} times)`).join("\n")}

Proactively address these common mistakes in your explanations.

`;
    }

    // Adjust teaching style
    if (memory.preferred_explanation_style === "simple") {
      prompt += `TEACHING STYLE: Keep explanations very simple. Use everyday analogies. Avoid jargon.\n`;
    } else if (memory.preferred_explanation_style === "example-heavy") {
      prompt += `TEACHING STYLE: Use many concrete examples. Show practical applications.\n`;
    } else if (memory.preferred_explanation_style === "visual") {
      prompt += `TEACHING STYLE: Describe concepts visually. Use diagrams descriptions and spatial analogies.\n`;
    }

    // Adjust pace
    if (memory.learning_speed === "slow") {
      prompt += `PACE: Take time with each concept. Check understanding frequently. Don't rush.\n`;
    } else if (memory.learning_speed === "fast") {
      prompt += `PACE: Move briskly through basics. Challenge the student with deeper questions.\n`;
    }
  }

  // Add subject context
  if (roomContext) {
    prompt += `CURRENT STUDY SESSION:\n${roomContext}\n\n`;
  }

  // Add recent activities for context
  if (context?.recent_activities?.length) {
    prompt += `RECENT ACTIVITIES:\n${context.recent_activities.slice(0, 5).map(a => `- ${a.description}`).join("\n")}\n\n`;
  }

  // Add quiz performance context
  if (context?.quiz_attempts?.length) {
    const lastQuiz = context.quiz_attempts[0];
    if (lastQuiz) {
      prompt += `LAST QUIZ PERFORMANCE:
- Score: ${lastQuiz.score}%
- Strengths: ${lastQuiz.strengths?.slice(0, 3).join(", ") || "Good effort!"}
- Areas to Improve: ${lastQuiz.weaknesses?.slice(0, 3).join(", ") || "Keep practicing!"}

`;
    }
  }

  prompt += `RESPONSE FORMAT:
- Use clear, organized formatting with headers (##) and bullet points
- Bold **key terms** for emphasis
- Use numbered lists for step-by-step explanations
- Include a brief "Quick Recap" at the end of explanations
- Always end by asking if the student wants to:
  1. See practice questions
  2. Try a quiz on this topic
  3. Generate flashcards
  4. Move to a related topic`;

  return prompt;
}

function shouldAddStructuredEnding(messages: { role: string; content: string }[]): boolean {
  if (messages.length === 0) return false;
  const lastMessage = messages[messages.length - 1];
  const content = lastMessage.content.toLowerCase();

  // Check if user is asking for explanation
  const explanationTriggers = ["explain", "what is", "how does", "why", "teach me", "help me understand", "tell me about"];
  return explanationTriggers.some(trigger => content.includes(trigger));
}

function appendLearningElements(message: string, context?: string): string {
  // Don't duplicate endings
  if (message.includes("Quick Recap") || message.includes("Would you like to")) {
    return message;
  }

  return message;
}
