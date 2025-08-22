import React, { useState } from 'react';

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

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1100] p-4 bg-black/40">
      <div className="bg-white/95 backdrop-blur-sm p-6 rounded-lg shadow-2xl w-80 max-w-xs mx-auto relative" style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="font-bold text-2xl text-center mb-4">Login</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
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
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
