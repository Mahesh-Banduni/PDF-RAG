import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  const { chatChannelId } = body;

  if (!chatChannelId) {
    return NextResponse.json({ message: 'Missing chatChannelId' }, { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { chatChannelId },
      include:{
        attachedPdf: true
      }
  });
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ message: 'Error fetching messages' }, { status: 500 });
  }
}
