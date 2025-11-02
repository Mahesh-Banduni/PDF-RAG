import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  const { userId, chatChannelId } = body;

  if (!userId) {
    return NextResponse.json({ message: 'Missing userId' }, { status: 400 });
  }

  try {
    const pdfs = await prisma.pdf.findMany({
      where: { chatChannel: { userId }, chatChannelId },
      select:{
        pdfId: true,
        title: true,
        chatChannelId: true,
        vectorIds: true,
        fileURL: true,
        createdAt: true
    }
  });
    return NextResponse.json(pdfs);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return NextResponse.json({ message: 'Error fetching PDFs' }, { status: 500 });
  }
}
