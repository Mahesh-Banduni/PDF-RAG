import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ----------------- Helper: Generate a title using Gemini -----------------
async function generateChatChannelId(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are an assistant that generates short concise and descriptive titles for chat channel.
      Based on the following content, suggest a suitable short title for chat channel (max 5 words):
      ---
      ${text} 
      ---
    `;
    const result = await model.generateContent(prompt);
    const title = result.response.text().trim();
    return title.replace(/^["']|["']$/g, ""); // remove quotes if any
  } catch (err) {
    console.error("Error generating title:", err);
  }
}

export async function POST(req) {
    const body = await req.json();
    const { userId, q} = body;

    if (!userId || !q) {
      return NextResponse.json({ message: 'Missing userId, title' }, { status: 400 });
    }
    const customTitle = await generateChatChannelId(q);

    try {
        const chatChannel = await prisma.chatChannel.create({
            data: {
                userId,
                title: customTitle,
            },
        });
        return NextResponse.json(chatChannel);
    } catch (error) {
        console.error('Error creating channel:', error);
        return NextResponse.json({ message: 'Error creating channel' }, { status: 500 });
    }
}