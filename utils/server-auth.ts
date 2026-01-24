import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  // Using project ID from Firebase config (smartlocations-d5dea)
  // For production with heightened security, consider using a service account key
  const projectId = 'smartlocations-d5dea';
  
  try {
    admin.initializeApp({
      projectId: projectId,
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

/**
 * Verify Firebase ID token from Authorization Bearer header
 * @param request Next.js request object
 * @returns User's decoded token if valid, null otherwise
 */
export async function verifyAuthToken(request: NextRequest | Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return null;
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if email is allowed
    const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
    if (allowedEmail && decodedToken.email !== allowedEmail) {
      console.warn(`Unauthorized email attempt: ${decodedToken.email}`);
      return null;
    }
    
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Middleware helper to protect API routes
 * Returns an error response if authentication fails
 */
export async function requireAuth(request: NextRequest | Request): Promise<NextResponse | null> {
  const decodedToken = await verifyAuthToken(request);
  
  if (!decodedToken) {
    return NextResponse.json(
      { error: 'Unauthorized. Valid authentication token required.' },
      { status: 401 }
    );
  }
  
  return null; // null means authentication passed
}

/**
 * Helper to get authenticated user info from request
 */
export async function getAuthenticatedUser(request: NextRequest | Request) {
  return await verifyAuthToken(request);
}
