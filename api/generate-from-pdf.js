import { IncomingForm } from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err || !files?.pdf) {
      console.error('Form error:', err);
      return res.status(400).json({ error: 'PDF upload failed.' });
    }

    try {
      const pdfPath = files.pdf[0].filepath;
      const pdfBuffer = fs.readFileSync(pdfPath);
      const data = await pdf(pdfBuffer);
      const extractedText = data.text;

      if (!extractedText || extractedText.trim().length < 20) {
        return res.status(500).json({ error: 'Failed to process PDF.' });
      }

      const prompt = `Generate 5 flashcards (Q&A) from the following study material:\n\n${extractedText}\n\nFormat:\nQ: ...\nA: ...`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      });

      const flashcards = response.choices[0]?.message?.content || '';
      return res.status(200).json({ flashcards });

    } catch (e) {
      console.error('Processing error:', e);
      return res.status(500).json({ error: 'Failed to process PDF.' });
    }
  });
}
