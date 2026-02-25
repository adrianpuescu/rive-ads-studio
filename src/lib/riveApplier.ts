/**
 * Rive AdSpec Applier
 * 
 * Pure utility that applies AdSpec configuration to a live Rive instance.
 * No React dependencies - can be used in any JavaScript context.
 */

import type { Rive } from '@rive-app/canvas';
import type { AdSpec } from '../types/ad-spec.schema';

/**
 * Applies an AdSpec to a running Rive instance
 * 
 * Call this after the Rive onLoad callback fires.
 * Applies text slots, state machine inputs, and prepares for color/asset slots.
 * 
 * @param rive - Live Rive instance
 * @param spec - AdSpec configuration to apply
 */
export async function applyAdSpec(rive: Rive, spec: AdSpec): Promise<void> {
  // 1. TEXT SLOTS
  applyTextSlots(rive, spec);

  // 2. STATE MACHINE INPUTS
  applyStateInputs(rive, spec);

  // COLOR SLOTS: applied via low-level API in a separate colorApplier.ts (future task)

  // ASSET SLOTS: applied via assetLoader callback at Rive instantiation time (future task)
}
  
/**
 * Applies text slot values to Rive text runs
 * Convention: slot key is uppercased and prefixed with "TEXT_"
 * e.g. headline → "TEXT_HEADLINE"
 */
function applyTextSlots(rive: Rive, spec: AdSpec): void {
  const { text } = spec;

  // Standard text slots
  const standardSlots = ['headline', 'subheadline', 'body', 'cta'] as const;

  for (const slot of standardSlots) {
    const value = text[slot];
    if (value?.value) {
      const runName = `TEXT_${slot.toUpperCase()}`;
      try {
        rive.setTextRunValue(runName, value.value);
      } catch (err) {
        console.warn(
          `Failed to set text run "${runName}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  // Custom text slots
  if (text.custom) {
    for (const [key, value] of Object.entries(text.custom)) {
      if (value?.value) {
        const runName = `TEXT_${key.toUpperCase()}`;
        try {
          rive.setTextRunValue(runName, value.value);
        } catch (err) {
          console.warn(
            `Failed to set custom text run "${runName}": ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
  }
}

/**
 * Applies state machine input values
 * Gracefully skips inputs that don't exist in the state machine
 */
function applyStateInputs(rive: Rive, spec: AdSpec): void {
  const { stateInputs, template } = spec;

  // Get state machine inputs
  let inputs;
  try {
    inputs = rive.stateMachineInputs(template.stateMachine);
  } catch (err) {
    console.warn(
      `Failed to get state machine inputs for "${template.stateMachine}": ${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  if (!inputs || inputs.length === 0) {
    console.warn(`No inputs found for state machine "${template.stateMachine}"`);
    return;
  }

  // Apply speed input
  if (stateInputs.speed !== undefined) {
    const speedInput = inputs.find((i) => i.name === 'speed');
    if (speedInput && 'value' in speedInput) {
      try {
        speedInput.value = stateInputs.speed;
      } catch (err) {
        console.warn(
          `Failed to set speed input: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    } else {
      console.warn('Speed input not found in state machine');
    }
  }

  // Apply intensity input
  if (stateInputs.intensity !== undefined) {
    const intensityInput = inputs.find((i) => i.name === 'intensity');
    if (intensityInput && 'value' in intensityInput) {
      try {
        intensityInput.value = stateInputs.intensity;
      } catch (err) {
        console.warn(
          `Failed to set intensity input: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    } else {
      console.warn('Intensity input not found in state machine');
    }
  }

  // Apply mood input (boolean flags)
  if (stateInputs.mood) {
    const moodInputName = `mood_${stateInputs.mood}`;
    const moodInput = inputs.find((i) => i.name === moodInputName);
    if (moodInput && 'value' in moodInput) {
      try {
        moodInput.value = true;
      } catch (err) {
        console.warn(
          `Failed to set mood input "${moodInputName}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    } else {
      console.warn(`Mood input "${moodInputName}" not found in state machine`);
    }
  }

  // Apply custom inputs
  // NOTE: trigger inputs (fire-only) are not handled here — future task
  if (stateInputs.custom) {
    for (const [name, value] of Object.entries(stateInputs.custom)) {
      const input = inputs.find((i) => i.name === name);
      if (input && 'value' in input) {
        try {
          input.value = value;
        } catch (err) {
          console.warn(
            `Failed to set custom input "${name}": ${err instanceof Error ? err.message : String(err)}`
          );
        }
      } else {
        console.warn(`Custom input "${name}" not found in state machine`);
      }
    }
  }
}
