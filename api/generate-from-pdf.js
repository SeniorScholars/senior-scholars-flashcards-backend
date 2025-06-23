import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
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
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Preflight request
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Failed to parse form' });
    }

    const uploadedFile = files.pdf?.[0] || files.pdf;
    if (!uploadedFile) {
      return res.status(400).json({ error: 'PDF upload failed.' });
    }

    try {
      const dataBuffer = fs.readFileSync(uploadedFile.filepath);
      const pdfData = await pdfParse(dataBuffer);

      const prompt = `Create 5 flashcards from the following text:\n\n${pdfData.text}\n\nFormat:\nQ: ...\nA: ...`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      const flashcards = completion.choices[0].message.content;
      return res.status(200).json({ flashcards });
    } catch (error) {
      return res.status(500).json({ error: 'Something went wrong while processing the PDF.' });
    }
  });
}
