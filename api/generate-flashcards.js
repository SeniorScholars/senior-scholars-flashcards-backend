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
          content: `Generate exactly 10 flashcards on the topic "${prompt}".
Each flashcard must contain:
- A clear question
- A detailed answer with 3 to 4 sentences
Format your output exactly like this:
1.
Q: What is ...?
A: Answer in detail.

2.
Q: What is ...?
A: ...

Continue until 10 flashcards are complete.
ONLY return the flashcards, nothing else.`,
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
