/**
 * AdSpec Schema
 * 
 * The canonical specification for a Rive-based ad creative.
 * Defines template reference, text slots, state machine inputs, colors, and assets.
 */

/** Text slot with value and optional styling metadata */
export interface TextSlot {
  value: string;
  maxLength?: number;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
  };
}

/** Ad size configuration */
export type AdSize = 
  | { preset: 'leaderboard' | 'rectangle' | 'skyscraper' | 'square' }
  | { width: number; height: number };

/** Generation metadata */
export interface GenerationMetadata {
  prompt: string;
  model: string;
  rationale: string;
  variantIndex: number;
}

export interface AdSpec {
  /** Schema version */
  version?: string;
  
  /** Unique identifier for this ad spec */
  id?: string;
  
  /** Creation timestamp (ISO string) */
  createdAt?: string;

  /** Template configuration */
  template: {
    /** Unique template identifier (maps to .riv file via registry) */
    id: string;
    /** Target artboard name in the .riv file */
    artboard: string;
    /** State machine name to instantiate */
    stateMachine: string;
  };

  /** Ad format specifications */
  format?: {
    size: AdSize;
    durationMs?: number;
    loop: boolean;
  };

  /** Text slot assignments */
  text: {
    /** Main headline text */
    headline?: TextSlot;
    /** Subheadline or description text */
    subheadline?: TextSlot;
    /** Body text */
    body?: TextSlot;
    /** Call-to-action text */
    cta?: TextSlot;
    /** Tagline text */
    tagline?: TextSlot;
    /** Additional custom text slots by slot name */
    custom?: Record<string, TextSlot>;
  };

  /** State machine input values */
  stateInputs: {
    /** Animation speed multiplier (0.1 - 3.0) */
    speed?: number;
    /** Animation intensity level (0 - 1.0) */
    intensity?: number;
    /** Mood/tone selector (maps to boolean inputs in state machine) */
    mood?: string;
    /** Additional custom state machine inputs by input name */
    custom?: Record<string, number | boolean>;
  };

  /** Color slot assignments (hex format) */
  colors: {
    /** Primary brand color (reserved for decorative shapes; not sent to Rive ViewModel yet) */
    primary: string;
    /** Secondary accent color (reserved for decorative shapes; not sent to Rive ViewModel yet) */
    secondary: string;
    /** Background color */
    background: string;
    /** Accent color */
    accent?: string;
    /** Headline text color (hex); must contrast with background. Optional for backwards compatibility. */
    headlineColor?: string;
    /** Subheadline text color (hex); subtler than headline. Optional for backwards compatibility. */
    subheadlineColor?: string;
    /** CTA button/text color (hex); stands out from rest of text. Optional for backwards compatibility. */
    ctaColor?: string;
    /** Additional custom color slots by slot name */
    custom?: Record<string, string>;
  };

  /** Asset slot assignments (URLs or local paths) */
  assets?: Record<string, string>;

  /** Generation metadata (populated by AI generator) */
  generation?: GenerationMetadata;
}

