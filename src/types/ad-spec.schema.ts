/**
 * AdSpec Schema
 * 
 * The canonical specification for a Rive-based ad creative.
 * Defines template reference, text slots, state machine inputs, colors, and assets.
 */

export interface AdSpec {
  /** Template configuration */
  template: {
    /** Unique template identifier (maps to .riv file via registry) */
    id: string;
    /** Target artboard name in the .riv file */
    artboard: string;
    /** State machine name to instantiate */
    stateMachine: string;
  };

  /** Text slot assignments */
  text: {
    /** Main headline text */
    headline?: string;
    /** Subheadline or description text */
    subheadline?: string;
    /** Call-to-action text */
    cta?: string;
    /** Brand or advertiser name */
    brand?: string;
    /** Additional custom text slots by slot name */
    custom?: Record<string, string>;
  };

  /** State machine input values */
  stateInputs: {
    /** Animation speed multiplier (0.1 - 3.0) */
    speed?: number;
    /** Animation intensity level (0 - 100) */
    intensity?: number;
    /** Mood/tone selector (maps to boolean inputs in state machine) */
    mood?: 'energetic' | 'calm' | 'playful' | 'professional';
    /** Additional custom state machine inputs by input name */
    custom?: Record<string, number | boolean>;
  };

  /** Color slot assignments (hex format) */
  colors: {
    /** Primary brand color */
    primary?: string;
    /** Secondary accent color */
    secondary?: string;
    /** Background color */
    background?: string;
    /** Text color override */
    textColor?: string;
    /** Additional custom color slots by slot name */
    custom?: Record<string, string>;
  };

  /** Asset slot assignments (URLs or local paths) */
  assets?: {
    /** Logo image slot */
    logo?: string;
    /** Product image slot */
    product?: string;
    /** Background image slot */
    backgroundImage?: string;
    /** Additional custom asset slots by slot name */
    custom?: Record<string, string>;
  };
}
