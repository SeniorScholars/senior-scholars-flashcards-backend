import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // ✅ Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  try {
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Create 5 flashcards on the topic "${prompt}". Format them like this:\n\nQ: [Question 1]\nA: [Answer 1]\n\nQ: [Question 2]\nA: [Answer 2]`,
        },
      ],
      temperature: 0.7,
    });

    const answer = chatResponse.choices[0].message.content;
    return res.status(200).json({ flashcards: answer });
  } catch (err) {
    console.error('OpenAI API Error:', err);
    return res.status(500).json({ error: 'Failed to generate flashcards' });
  }
}
