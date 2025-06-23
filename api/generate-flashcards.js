import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt field' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          const prompt = `Generate 10 flashcards for the topic "${prompt}". 
Each flashcard should be in this format:

Q: ...
A: ...

Give detailed answers (3–4 sentences). Only return the flashcards in numbered order from 1 to 10.`;
        },
      ],
    });

    const flashcards = response.choices[0]?.message?.content;
    if (!flashcards) throw new Error('No content returned from OpenAI.');
    res.status(200).json({ flashcards });
  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({ error: err.message });
  }
}
