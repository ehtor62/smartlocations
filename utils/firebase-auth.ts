import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import app from "./firebase";

export function signInWithGoogle() {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}
