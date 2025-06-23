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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Form parse error:", err);
      return res.status(400).json({ error: 'Form parsing failed' });
    }

    const uploadedFile = files.pdf;
    if (!uploadedFile || !uploadedFile.filepath) {
      console.error("❌ PDF file not received");
      return res.status(400).json({ error: 'PDF file not received properly' });
    }

    try {
      const dataBuffer = fs.readFileSync(uploadedFile.filepath);
      const pdfData = await pdfParse(dataBuffer);

      const prompt = `Generate 5 flashcards based on the following text:\n\n${pdfData.text.trim().slice(0, 3000)}\n\nUse this format:\nQ: ...\nA: ...`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      const flashcards = completion.choices[0].message.content;
      return res.status(200).json({ flashcards });
    } catch (e) {
      console.error("❌ PDF processing error:", e.message);
      return res.status(500).json({ error: 'Something went wrong while processing the PDF.' });
    }
  });
}
