import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import app from "./firebase";

export async function signInWithGoogle() {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  
  const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
  
  console.log("Signed in email:", result.user.email);
  console.log("Allowed email:", ALLOWED_EMAIL);
  console.log("Match:", result.user.email === ALLOWED_EMAIL);
  
  if (result.user.email !== ALLOWED_EMAIL) {
    await auth.signOut();
    throw new Error("Unauthorized user. Only the application owner can sign in.");
  }
  
  return result;
}

export async function signInWithEmail(email: string, password: string) {
  const auth = getAuth(app);
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    // If user doesn't exist, create a new account
    if (error.code === 'auth/user-not-found') {
      return await createUserWithEmailAndPassword(auth, email, password);
    }
    // For any other error (wrong password, invalid credential, etc), throw it
    throw error;
  }
}
