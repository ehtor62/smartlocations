import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { elements } = await request.json();

    if (!elements || !Array.isArray(elements)) {
      return NextResponse.json({ error: 'Elements array is required' }, { status: 400 });
    }

    const prompt = `Based on the data given ${JSON.stringify(elements)}, 
     make a plan how and why these places should be visited.`;
     //When mentioning websites, please format them as plain URLs starting with http:// or https:// (do not use markdown formatting like [text](url)).
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const report = completion.choices[0]?.message?.content || 'No report generated';

    return NextResponse.json({ report });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}