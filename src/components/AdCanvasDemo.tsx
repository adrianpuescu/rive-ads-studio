/**
 * AdCanvas Demo Component
 * 
 * Demonstrates the AdCanvas component with a hardcoded test AdSpec.
 */

import { AdCanvas } from './AdCanvas';
import type { AdSpec } from '../types/ad-spec.schema';

/**
 * Demo AdSpec for testing
 * Points to test-template.riv (needs to be placed in public/templates/)
 */
const demoSpec: AdSpec = {
  template: {
    id: "test-template",
    artboard: "Artboard",
    stateMachine: "State Machine 1",
  },
  text: {
    headline: "Hello Rive",
    subheadline: "Dynamic ad rendering powered by Rive",
    cta: "Learn More",
    brand: "RiveAds",
  },
  stateInputs: {
    speed: 1.0,
    intensity: 50,
    mood: "energetic",
  },
  colors: {
    primary: "#e84b2a",
    secondary: "#1e88e5",
    background: "#ffffff",
    textColor: "#333333",
  },
};

/**
 * Demo component showing AdCanvas in action
 */
export function AdCanvasDemo() {
  return (
    <div className="demo-container">
      <h2>AdCanvas Demo</h2>
      <p>
        Testing the core Rive rendering system with a hardcoded AdSpec.
      </p>
      <p className="demo-note">
        <strong>Note:</strong> Place a test .riv file at{' '}
        <code>public/templates/test-template.riv</code> with:
      </p>
      <ul className="demo-requirements">
        <li>Artboard named "default"</li>
        <li>State Machine named "State Machine 1"</li>
        <li>Text runs: TEXT_HEADLINE, TEXT_SUBHEADLINE, TEXT_CTA, TEXT_BRAND</li>
        <li>Inputs: speed (number), intensity (number), mood_energetic (boolean)</li>
      </ul>

      <div className="demo-canvas-wrapper">
        <AdCanvas spec={demoSpec} width={728} height={90} />
      </div>
    </div>
  );
}
