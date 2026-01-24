import { NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/server-auth';

export async function POST(request: Request) {
  // Verify authentication
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Retry logic for overloaded service
    let lastError = null;
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            const text = data.candidates[0].content.parts[0].text;
            return NextResponse.json({ response: text });
          } else {
            return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });
          }
        }

        const errorText = await response.text();
        console.error(`Gemini API response (attempt ${attempt}):`, response.status, response.statusText, errorText);
        
        // Handle specific error cases
        if (response.status === 503) {
          lastError = 'AI service is temporarily overloaded. Please try again in a few moments.';
          // Wait before retry (except on last attempt)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        } else if (response.status === 429) {
          lastError = 'Rate limit exceeded. Please wait a moment before trying again.';
        } else if (response.status === 400) {
          lastError = 'Invalid request format.';
          break; // Don't retry on 400 errors
        } else {
          lastError = `AI service error: ${response.statusText}`;
        }
        
        // Don't retry for non-retryable errors
        if (response.status !== 503 && response.status !== 429) {
          break;
        }
      } catch (fetchError) {
        console.error(`Network error (attempt ${attempt}):`, fetchError);
        lastError = 'Network connection failed. Please check your internet connection.';
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    return NextResponse.json({ error: lastError || 'Failed to get response from AI service' }, { status: 503 });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ error: 'Failed to get response from AI service' }, { status: 500 });
  }
}