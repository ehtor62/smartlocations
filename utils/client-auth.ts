import { getAuth } from 'firebase/auth';
import app from './firebase';

/**
 * Get the current user's Firebase ID token for API authentication
 * @returns Bearer token string or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const auth = getAuth(app);
    const user = auth.currentUser;
    
    if (!user) {
      console.warn('No authenticated user found');
      return null;
    }
    
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make an authenticated fetch request with Bearer token
 * @param url The URL to fetch
 * @param options Standard fetch options
 * @returns Fetch response
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }
  
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  
  return fetch(url, {
    ...options,
    headers,
  });
}
