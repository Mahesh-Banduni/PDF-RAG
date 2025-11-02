import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pinecone.index("pdfrag");

export async function DELETE(req) {
  const body = await req.json();
  const { pdfId } = body;

  if (!pdfId) {
    return NextResponse.json({ message: 'Missing pdfId' }, { status: 400 });
  }

  try {
    const pdf = await prisma.pdf.delete({
      where: { pdfId },
      select: { vectorIds: true } // ensure vectorIds are returned
    });

    await index.deleteMany(pdf.vectorIds);

    return NextResponse.json({ message: 'PDF and vectors removed successfully', pdf });
  } catch (error) {
    console.error('Error removing PDF or vectors:', error);
    return NextResponse.json({ message: 'Error removing PDF or vectors', error }, { status: 500 });
  }
}
