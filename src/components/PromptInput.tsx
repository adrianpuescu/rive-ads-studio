/**
 * PromptInput Component
 * 
 * Input interface for generating AdSpecs from natural language prompts.
 */

import { useState } from 'react';
import type { AdSpec } from '../types/ad-spec.schema';
import { generateAdSpec } from '../ai/specGenerator';

export interface PromptInputProps {
  onGenerate: (spec: AdSpec) => void;
}

export function PromptInput({ onGenerate }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateAdSpec({ prompt });
      onGenerate(result.spec);
      setPrompt(''); // Clear textarea on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ad');
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = isGenerating || !prompt.trim();

  return (
    <div style={{ marginBottom: '2rem' }}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your ad... e.g. a dreamy banner for a luxury perfume launch"
        rows={4}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          fontFamily: 'inherit',
          border: '1px solid #ccc',
          borderRadius: '4px',
          resize: 'vertical'
        }}
        disabled={isGenerating}
      />
      
      <button
        onClick={handleGenerate}
        disabled={isDisabled}
        style={{
          marginTop: '0.5rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          backgroundColor: isDisabled ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isDisabled ? 'not-allowed' : 'pointer'
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate Ad'}
      </button>

      {error && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
