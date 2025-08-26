import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '[SET]' : '[NOT SET]');
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
     make a plan why these places should be visited. Give a deep insight of the background of each notable place. Provide website links if possible.`;
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

    let report = completion.choices[0]?.message?.content || 'No report generated';

    // Remove a dot at the end of any website link (http/https)
    //report = report.replace(/(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)\./g, (match, url) => {
      // Only remove the dot if it is not followed by a letter or digit (to avoid breaking sentences like ".com. More info...")
    //  return url;
    //});

    return NextResponse.json({ report });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}