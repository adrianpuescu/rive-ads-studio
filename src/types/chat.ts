/**
 * Chat types for iterative ad refinement.
 */

import type { AdSpec } from './ad-spec.schema';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  specSnapshot?: AdSpec;
  timestamp: Date;
}
