import OpenAI from "openai";

// ✅ Uses secret key from Vercel environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid prompt." });
  }

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Create 5 flashcards on the topic "${prompt}". Format like:\n\nQ: Question\nA: Answer`,
      }],
      temperature: 0.7,
    });

    const result = chatResponse.choices?.[0]?.message?.content;

    if (!result) {
      return res.status(500).json({ error: "No flashcards returned by OpenAI." });
    }

    return res.status(200).json({ flashcards: result });

  } catch (err) {
    console.error("❌ OpenAI Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
}
