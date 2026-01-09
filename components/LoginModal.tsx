"use client";
import React, { useState, useEffect } from 'react';
import { signInWithGoogle } from '../utils/firebase-auth';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  loading?: boolean;
  error?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, onLogin, loading = false, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Clear form fields and errors when modal becomes visible
  useEffect(() => {
    if (visible) {
      setEmail('');
      setPassword('');
      setLoginError('');
    }
  }, [visible]);

  if (!visible) return null;

  const handleGoogleLogin = async () => {
    setLoginError('');
    try {
      await signInWithGoogle();
      onClose(); // Close modal on success
    } catch (error: any) {
      console.error("Login error caught:", error);
      setLoginError(error?.message || 'Google login failed.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1100] p-4 bg-black/40">
      <div className="bg-white/95 backdrop-blur-sm p-6 rounded-lg shadow-2xl w-80 max-w-xs mx-auto relative" style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
        <h2 className="font-bold text-2xl text-center mb-4">Login</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            setLoginError('');
            onLogin(email, password);
          }}
          className="flex flex-col gap-3"
        >
          <input
            type="email"
            placeholder="Email"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {(error || loginError) && <div className="text-red-600 text-sm text-center">{error || loginError}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-300" />
          <span className="mx-2 text-gray-400 text-xs">or</span>
          <div className="flex-grow h-px bg-gray-300" />
        </div>
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full border border-gray-300 rounded px-4 py-2 font-semibold text-gray-700 bg-white hover:bg-gray-100 transition-colors gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block" aria-hidden="true">
            <g>
              <path fill="#4285F4" d="M24 9.5c3.54 0 6.04 1.53 7.43 2.81l5.48-5.48C33.64 4.36 29.36 2 24 2 14.82 2 6.98 7.98 3.69 15.44l6.91 5.37C12.1 15.09 17.56 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.21-.42-4.73H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.36 46.1 31.45 46.1 24.55z"/>
              <path fill="#FBBC05" d="M10.6 28.82A14.5 14.5 0 019.5 24c0-1.68.3-3.3.83-4.82l-6.91-5.37A23.97 23.97 0 002 24c0 3.77.9 7.34 2.49 10.46l7.11-5.64z"/>
              <path fill="#EA4335" d="M24 44c5.36 0 9.86-1.77 13.15-4.82l-7.19-5.6c-2 1.36-4.56 2.17-7.96 2.17-6.44 0-11.9-5.59-13.4-12.95l-7.11 5.64C6.98 40.02 14.82 46 24 46z"/>
              <path fill="none" d="M2 2h44v44H2z"/>
            </g>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
