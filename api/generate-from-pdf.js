import nextConnect from 'next-connect';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ dest: '/tmp' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const handler = nextConnect();

handler.use(upload.single('pdf'));

handler.post(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const pdfBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(pdfBuffer);

    const prompt = `Create 5 flashcards from the following text:\n\n${data.text}\n\nFormat:\nQ: ...\nA: ...`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const flashcards = completion.choices[0].message.content;
    res.status(200).json({ flashcards });
  } catch (err) {
    console.error("❌ PDF processing error:", err.message);
    res.status(500).json({ error: 'Something went wrong while processing the PDF.' });
  }
});

export default handler;
