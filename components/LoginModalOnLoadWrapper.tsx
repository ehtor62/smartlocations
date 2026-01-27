"use client";
import React, { useState, useEffect, createContext, useContext } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import app from '../utils/firebase';
import LoginModal from '../components/LoginModal';


// Context to provide user info
export const UserContext = createContext<User | null>(null);

export function useFirebaseUser() {
  return useContext(UserContext);
}

export default function LoginModalOnLoadWrapper({ children }: { children: React.ReactNode }) {
  const [loginVisible, setLoginVisible] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check email restriction for ALL users
        const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
        
        if (firebaseUser.email !== ALLOWED_EMAIL) {
          console.log("Unauthorized user detected, signing out");
          await auth.signOut();
          setLoginError("Unauthorized user. Only the application owner can sign in.");
          return;
        }
      }
      setUser(firebaseUser);
      setLoginVisible(!firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoginError('');
    try {
      const { signInWithEmail } = await import('../utils/firebase-auth');
      await signInWithEmail(email, password);
      // onAuthStateChanged will handle closing the modal
    } catch (error: any) {
      let errorMessage = 'Error: wrong password';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Error: invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Error: password should be at least 6 characters';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Error: wrong password';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Error: wrong password';
      }
      setLoginError(errorMessage);
    }
  };

  return (
    <UserContext.Provider value={user}>
      <LoginModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onLogin={handleLogin}
        error={loginError}
      />
      {children}
    </UserContext.Provider>
  );
}
