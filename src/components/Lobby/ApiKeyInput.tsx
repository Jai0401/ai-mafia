// src/components/Lobby/ApiKeyInput.tsx
import { useState } from 'react';

interface Props {
  onKeySubmit: (key: string) => void;
}

export default function ApiKeyInput({ onKeySubmit }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const validateKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (response.ok) {
        localStorage.setItem('ai-mafia-api-key', apiKey);
        onKeySubmit(apiKey);
      } else {
        setError('Invalid API key. Please check and try again.');
      }
    } catch {
      setError('Failed to validate key. Please check your connection.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#131313] text-[#e2e2e2] font-pixel">
      <h1 className="text-4xl font-bold text-[#e8a84c] mb-2 uppercase tracking-tighter">
        AI Mafia
      </h1>
      <p className="text-[#7a7d8a] mb-8 text-lg">
        A fully AI-driven social deduction game
      </p>

      <div className="bg-[#1b1b1b] border border-[#353535] p-8 max-w-md w-full">
        <h2 className="text-lg text-[#e2e2e2] mb-4 uppercase tracking-wider font-bold">
          Enter OpenRouter API Key
        </h2>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-v1-..."
          className="w-full bg-[#131313] border border-[#353535] px-4 py-3 text-[#e2e2e2] font-mono text-sm mb-4 focus:outline-none focus:border-[#e8a84c]"
        />
        {error && (
          <p className="text-[#c0392b] text-sm mb-4">{error}</p>
        )}
        <button
          onClick={validateKey}
          disabled={isValidating}
          className="w-full bg-[#e8a84c] text-[#131313] font-bold py-3 hover:bg-[#e8a84c]/90 transition-colors disabled:opacity-50 uppercase text-xs tracking-wider"
        >
          {isValidating ? 'Validating...' : 'Continue'}
        </button>
        <p className="text-[#7a7d8a] text-xs mt-4 text-center">
          Get a free key at{' '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#e8a84c] hover:underline"
          >
            openrouter.ai
          </a>
        </p>
      </div>
    </div>
  );
}
