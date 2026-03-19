import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { task } = await req.json();

    if (!task || typeof task !== "string" || task.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a task description." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a productivity assistant. The user will give you a task description. Break it into pomodoro-sized chunks (each chunk should take roughly 25 minutes of focused work).

Return ONLY a JSON array of objects. Each object has:
- "title": short name for the chunk (max 60 chars)
- "deliverable": what should be done/produced by the end of this pomodoro (1 sentence)
- "steps": array of 2-4 concrete micro-steps

Example:
[
  {
    "title": "Set up project structure",
    "deliverable": "Project scaffolded with dependencies installed",
    "steps": ["Create directory and init", "Install core deps", "Set up config files"]
  }
]

Rules:
- Each chunk = ~25 min of work
- Be specific and actionable
- Return between 2 and 12 chunks
- Return ONLY valid JSON, no markdown fences, no commentary`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: task },
        ],
        temperature: 0.4,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq API error:", errText);
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "[]";

    // Parse the JSON from the response, stripping possible markdown fences
    const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const chunks = JSON.parse(cleaned);

    return NextResponse.json({ chunks });
  } catch (err) {
    console.error("Split API error:", err);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
