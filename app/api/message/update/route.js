import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req) {
    const body = await req.json();
    const { content, messageId } = body;
    if (!content || !messageId) {
        return NextResponse.json({ message: 'Missing content or messageId' }, { status: 400 });
    }
    try {
         const message = await prisma.message.update({
             where: { messageId: messageId},
             data: {
                content
             },
         });
         return NextResponse.json(message);
    } catch (error) {
        console.error('Error updating message:', error);
        return NextResponse.json({ message: 'Error updating message' }, { status: 500 });
    }
}