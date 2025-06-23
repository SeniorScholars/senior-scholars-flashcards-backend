import OpenAI from "openai";
import pdfParse from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from "formidable";
import fs from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    if (err) return res.status(500).json({ error: "Error parsing file." });

    const file = files.pdf;
    if (!file) return res.status(400).json({ error: "No PDF uploaded." });

    const buffer = fs.readFileSync(file[0].filepath);
    const pdfData = await pdfParse(buffer);

    const promptText = pdfData.text.slice(0, 2000); // Truncate long files

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Create 5 flashcards from the following text:\n\n${promptText}`,
      }],
      temperature: 0.7,
    });

    const result = response.choices?.[0]?.message?.content;

    if (!result) return res.status(500).json({ error: "No response from OpenAI." });

    return res.status(200).json({ flashcards: result });
  });
}
