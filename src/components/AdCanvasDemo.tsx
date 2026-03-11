/**
 * ItemCanvas Demo Component
 *
 * Demonstrates the ItemCanvas component with a hardcoded test ItemSpec.
 */

import { AdCanvas } from './AdCanvas';
import type { AdSpec } from '../types/ad-spec.schema';

/**
 * Demo AdSpec for testing
 * Points to test-template.riv (needs to be placed in public/templates/)
 */
const demoSpec: AdSpec = {
  template: {
    id: 'test-template',
    artboard: 'Banner 728x90',
    stateMachine: 'State Machine 1',
  },
  text: {
    headline: { value: 'Hello Rive' },
    subheadline: { value: 'Dynamic ad rendering powered by Rive' },
    cta: { value: 'Learn More' },
  },
  stateInputs: {
    speed: 0.5,
    intensity: 0.3,
    mood: 'dreamy',
  },
  colors: {
    primary: '#e84b2a',
    secondary: '#1e88e5',
    background: '#ffffff',
    headlineColor: '#333333',
  },
};

/**
 * Demo component showing ItemCanvas in action
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
        <li>Artboard named &quot;Banner 728x90&quot;</li>
        <li>State Machine named &quot;State Machine 1&quot;</li>
        <li>Text runs: TEXT_HEADLINE, TEXT_SUBHEADLINE, TEXT_CTA</li>
        <li>Inputs: speed (number), intensity (number), mood_dreamy (boolean)</li>
      </ul>

      <div className="demo-canvas-wrapper">
        <AdCanvas spec={demoSpec} width={728} height={90} />
      </div>
    </div>
  );
}
