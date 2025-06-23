// /api/generate-flashcards.js

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { prompt } = req.body;

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "No prompt provided" });
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Create 5 flashcards on the topic "${prompt}". Format them like this:

Q: [Question 1]
A: [Answer 1]

Q: [Question 2]
A: [Answer 2]

Q: [Question 3]
A: [Answer 3]

Q: [Question 4]
A: [Answer 4]

Q: [Question 5]
A: [Answer 5]`,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    const output = completion.choices[0].message.content;
    res.status(200).json({ flashcards: output });
  } catch (err) {
    console.error("Error from OpenAI:", err);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
}
