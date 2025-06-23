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

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'File upload failed' });

    const file = files.pdf;
    if (!file) return res.status(400).json({ error: 'No PDF uploaded' });

    const dataBuffer = fs.readFileSync(file[0].filepath);
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text.slice(0, 3000); // avoid token limits

    const prompt = `Create 5 flashcards based on the following content:\n\n${extractedText}\n\nFormat:\nQ: ...\nA: ...`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      });

      const flashcards = completion.choices[0].message.content;
      res.status(200).json({ flashcards });
    } catch (error) {
      res.status(500).json({ error: 'OpenAI error' });
    }
  });
}
