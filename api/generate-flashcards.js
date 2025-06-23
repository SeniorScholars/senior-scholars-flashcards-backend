import OpenAI from "openai";

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
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Create 5 flashcards on the topic "${prompt}". Format like:\n\nQ: Question\nA: Answer`,
        },
      ],
      temperature: 0.7,
    });

    const flashcards = response.choices?.[0]?.message?.content;

    if (!flashcards) {
      return res.status(500).json({ error: "No flashcards returned from OpenAI." });
    }

    res.status(200).json({ flashcards });

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
}
