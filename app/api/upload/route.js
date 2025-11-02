import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { prisma } from '../../lib/prisma';

// Initialize Gemini Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Pinecone client
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index("pdfrag");

// ----------------- Helper: Extract text from PDF buffer -----------------
async function extractTextFromPDFBuffer(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const tempDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const tempPath = path.join(tempDir, crypto.randomUUID() + ".pdf");
  fs.writeFileSync(tempPath, buffer);

  const loader = new PDFLoader(tempPath, { splitPages: true });
  const pdfDocs = await loader.load();
  fs.unlinkSync(tempPath);

  return pdfDocs;
}

// ----------------- Helper: Generate a title using Gemini -----------------
async function generatePdfTitle(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are an assistant that generates concise and descriptive titles for documents.
      Based on the following content, suggest a suitable title for the PDF (max 10 words):
      ---
      ${text.slice(0, 3000)} 
      ---
    `;
    const result = await model.generateContent(prompt);
    const title = result.response.text().trim();
    return title.replace(/^["']|["']$/g, ""); // remove quotes if any
  } catch (err) {
    console.error("Error generating title:", err);
    return "Untitled Document";
  }
}

// ----------------- API route -----------------
export async function POST(req) {
  try {
    const formData = await req.formData();
    const input = formData.get("input")?.toString() || "";
    const file = formData.get("file");
    const chatChannelId = formData.get("chatChannelId")?.toString() || "unknown";

    let docs = [];

    // Handle PDF file
    if (file && file instanceof File && file.type === "application/pdf") {
      const pdfDocs = await extractTextFromPDFBuffer(file);
      docs.push(...pdfDocs);
    }

    // Handle raw text input
    if (input) docs.push(new Document({ pageContent: input }));

    if (!docs.length) {
      return NextResponse.json({ message: "No input or file provided" }, { status: 400 });
    }

    // Combine first few pages for title generation
    const combinedText = docs.slice(0, 3).map(d => d.pageContent).join("\n").slice(0, 8000);
    const pdfTitle = await generatePdfTitle(combinedText);

    // Split documents into chunks
    const splitter = new CharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    const chunks = await splitter.splitDocuments(docs);

    // Generate embeddings using Gemini
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const vectors = [];

    for (const chunk of chunks) {
      const response = await embeddingModel.embedContent({
        content: { parts: [{ text: chunk.pageContent }] },
        outputDimensionality: 768,
      });

      vectors.push({
        id: crypto.randomUUID(),
        values: response.embedding.values,
        metadata: {
          text: chunk.pageContent,
          title: pdfTitle,
          chatChannelId,
        },
      });
    }

    // Upsert to Pinecone
    await index.upsert(vectors);

    // Extract all vector IDs
    const vectorIds = vectors.map(v => v.id);

    const formData1 = new FormData();
    formData1.append("file", file);

    const uploadRes = await fetch(`${process.env.NEXTAUTH_URL}/api/pdf/upload`, {
      method: "POST",
      body: formData1,
    });
    const uploaded = await uploadRes.json();

    // Save PDF record to database
    const pdf = await prisma.pdf.create({
      data: {
        title: pdfTitle,
        vectorIds: vectorIds,
        chatChannelId,
        fileURL: uploaded.fileUrl
      },
    });

    // console.log(`Uploaded ${vectors.length} chunks for "${pdfTitle}" by ${clerkId}.`);

    return NextResponse.json({
      pdf
    });
  } catch (err) {
    console.error("Upload to Pinecone error:", err);
    return NextResponse.json("Something went wrong.", { status: 500 });
  }
}
