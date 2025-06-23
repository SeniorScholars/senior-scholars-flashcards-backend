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
  // ✅ Proper CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle Preflight Request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Form parsing error:", err);
      return res.status(400).json({ error: 'Form parse failed.' });
    }

    const uploaded = files.pdf?.[0] || files.pdf;
    if (!uploaded) {
      console.error("❌ No PDF file found.");
      return res.status(400).json({ error: 'No PDF uploaded.' });
    }

    try {
      const buffer = fs.readFileSync(uploaded.filepath);
      const parsed = await pdfParse(buffer);

      const prompt = `Create 5 flashcards from this content:\n\n${parsed.text}\n\nFormat:\nQ: ...\nA: ...`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      const flashcards = completion.choices[0]?.message?.content;
      return res.status(200).json({ flashcards });
    } catch (err) {
      console.error("❌ Error during PDF parsing:", err);
      return res.status(500).json({ error: 'Something went wrong during PDF processing.' });
    }
  });
}
