import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // ✅ CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight (OPTIONS) request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "No topic provided." });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Create 5 flashcards on the topic "${prompt}". Format them like this:\n\nQ: [Question 1]\nA: [Answer 1]\n\n...and so on.`
      }],
      temperature: 0.7,
      max_tokens: 700,
    });

    const flashcards = response.choices[0].message.content;
    res.status(200).json({ flashcards });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({ error: "Failed to generate flashcards." });
  }
}
