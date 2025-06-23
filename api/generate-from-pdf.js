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

  const form = new formidable.IncomingForm({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err || !files.pdf) {
      console.error("Formidable error or missing PDF:", err, files);
      return res.status(400).json({ error: 'PDF upload failed.' });
    }

    try {
      const filePath = files.pdf[0]?.filepath || files.pdf.filepath;
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);

      const prompt = `Create 5 flashcards from the following text:\n\n${pdfData.text}\n\nFormat:\nQ: ...\nA: ...`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
      });

      const flashcards = completion.choices[0].message.content;
      return res.status(200).json({ flashcards });
    } catch (error) {
      console.error('PDF processing error:', error);
      return res.status(500).json({ error: 'Something went wrong while processing the PDF.' });
    }
  });
}
