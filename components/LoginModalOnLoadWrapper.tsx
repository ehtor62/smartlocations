"use client";
import React, { useState } from 'react';
import LoginModal from '../components/LoginModal';

export default function LoginModalOnLoadWrapper({ children }: { children: React.ReactNode }) {
  const [loginVisible, setLoginVisible] = useState(true);

  const handleLogin = (email: string, password: string) => {
    // Implement your login logic here
    // For demo, just close the modal
    setLoginVisible(false);
  };

  return (
    <>
      <LoginModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onLogin={handleLogin}
      />
      {children}
    </>
  );
}
