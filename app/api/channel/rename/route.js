import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req) {
  const body = await req.json();
  const { chatChannelId, title } = body;

  if (!chatChannelId) {
    return NextResponse.json({ message: 'Missing chatChannelId' }, { status: 400 });
  }

  try {
    const chatChannel = await prisma.chatChannel.update({
      where: { chatChannelId },
      data:{
        title
      }
  });
    return NextResponse.json(chatChannel);
  } catch (error) {
    console.error('Error renaming chat channel:', error);
    return NextResponse.json({ message: 'Error renaming chat channel' }, { status: 500 });
  }
}
