import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt." });
    }

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Create 5 flashcards on the topic "${prompt}". Format them like this:

Q: [Question 1]
A: [Answer 1]

Q: [Question 2]
A: [Answer 2]`,
        },
      ],
      temperature: 0.7,
    });

    const answer = chatResponse.choices?.[0]?.message?.content;
    if (!answer) {
      return res.status(500).json({ error: "No content returned from OpenAI" });
    }

    res.status(200).json({ flashcards: answer });
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
