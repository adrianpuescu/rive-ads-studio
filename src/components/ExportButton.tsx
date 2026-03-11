/**
 * ExportButton Component
 * 
 * Triggers download of self-contained HTML file with Rive ad.
 */

import type { AdSpec } from '../types/ad-spec.schema';
import { generateEmbedHtml } from '../lib/exportHtml';

export interface ExportButtonProps {
  spec: AdSpec;
  rivFileName: string;
}

export function ExportButton({ spec, rivFileName }: ExportButtonProps) {
  const handleExport = () => {
    // Generate HTML content
    const htmlContent = generateEmbedHtml(spec, rivFileName);
    
    // Create blob
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    // Generate filename from headline or use fallback
    const headline = spec.text.headline?.value;
    const filename = headline 
      ? `${headline.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ad.html`
      : 'riveads-export.html';
    
    // Create temporary download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      className="inline-flex items-center h-8 px-3 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 border-0 cursor-pointer transition-colors duration-150"
      onClick={handleExport}
      type="button"
    >
      Export HTML
    </button>
  );
}
