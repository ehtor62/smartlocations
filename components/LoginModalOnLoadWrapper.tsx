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

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoginVisible(!firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (email: string, password: string) => {
    // Implement your login logic here
    setLoginVisible(false);
  };

  return (
    <UserContext.Provider value={user}>
      <LoginModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onLogin={handleLogin}
      />
      {children}
    </UserContext.Provider>
  );
}
