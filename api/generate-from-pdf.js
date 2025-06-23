const multiparty = require('multiparty');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST requests allowed' });

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Form parse error:", err);
      return res.status(400).json({ error: 'Failed to parse form.' });
    }

    const uploadedFile = files.pdf?.[0];
    if (!uploadedFile) {
      console.error("❌ No file found in 'pdf' field.");
      return res.status(400).json({ error: 'PDF upload failed.' });
    }

    try {
      const dataBuffer = fs.readFileSync(uploadedFile.path);
      const pdfData = await pdfParse(dataBuffer);

      const prompt = `Create 5 flashcards from the following PDF content:\n\n${pdfData.text}\n\nFormat:\nQ: ...\nA: ...`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
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
