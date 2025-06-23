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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST requests allowed' });

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Form parse error:", err);
      return res.status(400).json({ error: 'Failed to parse form.' });
    }

    const uploadedFile = files.pdf?.[0] || files.pdf;
    if (!uploadedFile) {
      console.error("❌ No file found in 'pdf' field.");
      return res.status(400).json({ error: 'PDF upload failed.' });
    }

    try {
      const dataBuffer = fs.readFileSync(uploadedFile.filepath);
      const pdfData = await pdfParse(dataBuffer);

      content: `From the following text, generate exactly 10 flashcards.
Each should have:
- A clear question
- A detailed answer (3 to 4 sentences)

Format:
1.
Q: ...
A: ...

Only return the flashcards. Text to extract from:

${pdfData.text}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      const flashcards = completion.choices[0].message.content;
      return res.status(200).json({ flashcards });
    } catch (error) {
      console.error("❌ Error during PDF processing:", error.message);
      return res.status(500).json({ error: 'Something went wrong while processing the PDF.' });
    }
  });
}
