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
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="font-display text-5xl font-bold text-accent-amber mb-2">
        AI Mafia
      </h1>
      <p className="text-text-muted mb-8 font-body text-lg">
        A fully AI-driven social deduction game
      </p>

      <div className="bg-bg-room rounded-lg p-8 max-w-md w-full border border-text-muted/20">
        <h2 className="font-display text-xl text-text-primary mb-4">
          Enter OpenRouter API Key
        </h2>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-v1-..."
          className="w-full bg-bg-deep border border-text-muted/30 rounded px-4 py-3 text-text-primary font-mono text-sm mb-4 focus:outline-none focus:border-accent-amber"
        />
        {error && (
          <p className="text-accent-red text-sm mb-4">{error}</p>
        )}
        <button
          onClick={validateKey}
          disabled={isValidating}
          className="w-full bg-accent-amber text-bg-deep font-display font-semibold py-3 rounded hover:bg-accent-amber/90 transition-colors disabled:opacity-50"
        >
          {isValidating ? 'Validating...' : 'Continue'}
        </button>
        <p className="text-text-muted text-xs mt-4 text-center">
          Get a free key at{' '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-amber hover:underline"
          >
            openrouter.ai
          </a>
        </p>
      </div>
    </div>
  );
}
