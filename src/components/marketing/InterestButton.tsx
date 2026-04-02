'use client';

import { useState } from 'react';

export function InterestButton() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(false);
    
    try {
      const res = await fetch('/api/mailerlite/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500 text-green-400 p-4 rounded-xl text-center font-medium animate-in fade-in slide-in-from-bottom-2">
        ¡Añadido a la lista! Te avisaremos cuando el curso esté listo.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        required
        placeholder="Tu mejor email..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
      />
      <button
        type="submit"
        disabled={loading || !email}
        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
      >
        {loading ? 'Apuntando...' : 'Me interesa la clase'}
      </button>
      {error && <span className="text-red-400 text-xs absolute -bottom-6">Hubo un error. Contáctanos si persiste.</span>}
    </form>
  );
}
