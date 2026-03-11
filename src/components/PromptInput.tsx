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
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = isGenerating || !prompt.trim();

  return (
    <div className="prompt-input-container">
      <label className="prompt-input-label" htmlFor="prompt-textarea">
        Describe your ad
      </label>
      
      <textarea
        id="prompt-textarea"
        className="prompt-input-textarea"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. a dreamy banner for a luxury perfume launch"
        disabled={isGenerating}
      />
      
      <button
        className={`prompt-input-button ${isGenerating ? 'prompt-input-button-loading' : ''}`}
        onClick={handleGenerate}
        disabled={isDisabled}
      >
        {isGenerating ? 'Generating' : 'Generate'}
      </button>

      {error && (
        <p className="prompt-input-error">{error}</p>
      )}
    </div>
  );
}
