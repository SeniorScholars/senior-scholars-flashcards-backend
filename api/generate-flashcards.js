import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const contentType = req.headers["content-type"] || "";

  // Handle JSON request for topic-based flashcards
  if (contentType.includes("application/json")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const { prompt } = JSON.parse(body);

        if (!prompt) return res.status(400).json({ error: "Missing prompt" });

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Create 5 flashcards on the topic "${prompt}". Format:\n\nQ: Question\nA: Answer`,
            },
          ],
        });

        const result = response.choices?.[0]?.message?.content;
        res.status(200).json({ flashcards: result });
      } catch (err) {
        res.status(500).json({ error: "OpenAI error or invalid request" });
      }
    });

    return;
  }

  // Handle PDF upload
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err || !files.pdf) {
      return res.status(400).json({ error: "PDF file required" });
    }

    try {
      const buffer = fs.readFileSync(files.pdf[0].filepath);
      const pdfData = await pdfParse(buffer);

      const promptText = pdfData.text.slice(0, 2000); // Limit length for OpenAI

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Create 5 flashcards from the following text:\n\n${promptText}\n\nFormat:\nQ: Question\nA: Answer`,
          },
        ],
      });

      const result = response.choices?.[0]?.message?.content;
      res.status(200).json({ flashcards: result });
    } catch (err) {
      res.status(500).json({ error: "Failed to generate flashcards" });
    }
  });
}
