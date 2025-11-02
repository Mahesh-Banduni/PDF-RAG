import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
    const body = await req.json();
    const { role, content, chatChannelId, replyToMessageId, attachedPdfId } = body;
    if (!role || !content || !chatChannelId) {
        return NextResponse.json({ message: 'Missing role, content, or chatChannelId' }, { status: 400 });
    }
    try {
        const message = await prisma.message.create({
            data: {
                role,
                content,
                chatChannelId,
                replyToMessageId,
                attachedPdfId
            },
        });
        return NextResponse.json(message);
    } catch (error) {
        console.error('Error creating message:', error);
        return NextResponse.json({ message: 'Error creating message' }, { status: 500 });
    }
}