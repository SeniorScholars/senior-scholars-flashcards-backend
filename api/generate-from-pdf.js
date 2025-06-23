import { IncomingForm } from 'multiparty';
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

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(400).json({ error: "Failed to parse form" });
    }

    const file = files.pdf?.[0];
    if (!file) {
      console.error("No PDF found in request");
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    try {
      const buffer = fs.readFileSync(file.path);
      const parsed = await pdfParse(buffer);

      const prompt = `Create 5 flashcards from this text:\n\n${parsed.text}\n\nFormat:\nQ: ...\nA: ...`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      const flashcards = completion.choices[0]?.message?.content;
      return res.status(200).json({ flashcards });
    } catch (e) {
      console.error("PDF error:", e);
      return res.status(500).json({ error: "Failed to process PDF." });
    }
  });
}
