import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ message: 'Missing userId' }, { status: 400 });
  }

  try {
    const chatChannels = await prisma.chatChannel.findMany({
      where: { userId }
  });
    return NextResponse.json(chatChannels);
  } catch (error) {
    console.error('Error fetching chat channels:', error);
    return NextResponse.json({ message: 'Error fetching chat channels' }, { status: 500 });
  }
}
