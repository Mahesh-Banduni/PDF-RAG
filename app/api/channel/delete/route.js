import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pinecone.index("pdfrag");

export async function POST(req) {
  const body = await req.json();
  const { userId, chatChannelId } = body;

  if (!userId || !chatChannelId) {
    return NextResponse.json({ message: 'Missing userId or chatChannelId' }, { status: 400 });
  }

  try {
    const pdfs = await prisma.pdf.findMany({
      where: { chatChannelId }
    });

    if (pdfs.length > 0) {
      for (const pdf of pdfs) {
        await index.deleteMany(pdf.vectorIds);
      }
      await prisma.pdf.deleteMany({
        where: { chatChannelId }
      });
    }

    const messages = await prisma.message.deleteMany({
      where: { chatChannelId }
    });

    const chatChannels = await prisma.chatChannel.delete({
      where: { userId, chatChannelId }
    });
    return NextResponse.json(chatChannels);
  } catch (error) {
    console.error('Error fetching chat channels:', error);
    return NextResponse.json({ message: 'Error fetching chat channels' }, { status: 500 });
  }
}
