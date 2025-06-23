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

  const form = new formidable.IncomingForm({
    multiples: false,
    keepExtensions: true,
  });

  console.log("📥 Parsing form...");

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Formidable error:", err);
      return res.status(400).json({ error: 'Formidable failed to parse form.' });
    }

    console.log("✅ Fields:", fields);
    console.log("✅ Files:", files);

    if (!files || !files.pdf) {
      console.error("❌ PDF not found in uploaded files.");
      return res.status(400).json({ error: 'PDF upload failed. No file received.' });
    }

    try {
      const filePath = files.pdf[0]?.filepath || files.pdf.filepath;
      console.log("📁 PDF file path:", filePath);

      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);

      console.log("📄 PDF Text Preview:", pdfData.text.substring(0, 300));

      const prompt = `Create 5 flashcards from the following text:\n\n${pdfData.text}\n\nFormat:\nQ: ...\nA: ...`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
      });

      const flashcards = completion.choices[0].message.content;
      return res.status(200).json({ flashcards });
    } catch (error) {
      console.error("❌ PDF processing error:", error);
      return res.status(500).json({ error: 'Something went wrong while processing the PDF.' });
    }
  });
}
