import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(req) {
  const body = await req.json();
  const { messageIds } = body;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return NextResponse.json({ message: 'Missing or invalid messageIds' }, { status: 400 });
  }

  try {
    const deletedMessages = await prisma.message.deleteMany({
      where: { messageId: { in: messageIds } },
    });
    return NextResponse.json(deletedMessages);
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ message: 'Error deleting message' }, { status: 500 });
  }
}
