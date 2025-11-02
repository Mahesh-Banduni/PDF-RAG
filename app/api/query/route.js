import { NextResponse } from 'next/server';
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pinecone.index("pdfrag");

export const config = {
  api: {
    bodyParser: true,
  },
};

// Embed text using Gemini embeddings
async function embedText(text) {
  try {
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResponse = await embeddingModel.embedContent({
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    });
    const embedding = embeddingResponse.embedding.values;
    if (!embedding) throw new Error('Failed to get embedding from Gemini');
    return embedding;
  } catch (err) {
    console.error('Embedding Error:', err);
    throw new Error(err.message || 'Embedding request to Gemini failed');
  }
}

// Query Pinecone with channel filter
async function queryVectors(vector, chatChannelId) {
  try {
    const searchResponse = await index.query({
      vector,
      topK: 5,
      includeMetadata: true,
      filter: chatChannelId ? { chatChannelId } : undefined,
    });
    return searchResponse.matches || [];
  } catch (err) {
    console.error('Pinecone Error:', err.response?.data || err.message);
    throw new Error('Failed to query Pinecone index');
  }
}

// Generate streamed answer using Gemini
async function* generateWithContextStream(question, context, messageContext) {
  const limitedContext = context
    .map((c) => c.text)
    .join('\n---\n')
    .slice(0, 6000);

  const prompt = `You are an AI assistant helping users with information from their uploaded PDFs. Use the provided context to answer the question accurately.

Conversation History:
${JSON.stringify(messageContext ?? [], null, 2)}

PDF Context:
${limitedContext}

Question: ${question}

Instructions:
  1. Use the following conversation history as base context:\n${JSON.stringify(messageContext, null, 2)}\n\n
  2. Answer the question using primarily the following PDF context:\n${limitedContext}\n\n
  3. Question: ${question}\nAnswer:
  4. If the answer is not contained within either the conversation history or PDF context, respond with: "I'm your AI Powered PDF assistant — I don't have that particular information available. I'd be happy to assist you with content from your uploaded documents."
  5. Be concise and to the point.
  6. Use proper grammar and punctuation.
  7. Do not fabricate information.
  8. If someone asks for a list or if the answer is a list, provide a bulleted list format.
  9. Prioritize information from the PDF context when available, but use conversation history to maintain context and continuity.
  10. If the user is asking about your capabilities or what you can do, you can respond helpfully while maintaining your role as a PDF assistant.
  11. Maintain a friendly and helpful tone throughout the conversation.
`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash", // or gemini-2.5-flash if enabled
    generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
  });

  // ✅ Correct streaming function for this SDK
  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const partial = chunk?.text();
    if (partial) yield partial;
  }
}

// Main API route with SSE streaming
export async function POST(req) {
  try {
    const { question, chatChannelId, messageContext } = await req.json();
    if (!question) {
      return new Response('No question provided', { status: 400 });
    }

    const queryVector = await embedText(question);
    const matches = await queryVectors(queryVector, chatChannelId);

    const context = matches.map((m) => ({ text: m.metadata?.text || '' }));

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const textChunk of generateWithContextStream(question, context, messageContext)) {
            const sseChunk = `data: ${textChunk.replace(/\n/g, '\\n')}\n\n`;
            controller.enqueue(new TextEncoder().encode(sseChunk));
          }
          controller.close();
        } catch (err) {
          console.error('Streaming Generation Error:', err);
          controller.enqueue(new TextEncoder().encode('data: [Error generating response]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Query Error:', err);
    return NextResponse.json({ answer: 'Sorry, I am facing some technical difficulties. Please try again after some time.' });
  }
}
