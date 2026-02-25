/**
 * HTML Export Utility
 * 
 * Generates self-contained HTML files with embedded Rive animations
 * and AdSpec configuration applied.
 */

import type { AdSpec, AdSize } from '../types/ad-spec.schema';

/**
 * Gets width and height from AdSize configuration
 */
function getAdDimensions(size: AdSize): { width: number; height: number } {
  if ('width' in size) return { width: size.width, height: size.height };
  
  const presets: Record<string, { width: number; height: number }> = {
    leaderboard: { width: 728, height: 90 },
    rectangle: { width: 300, height: 250 },
    'half-page': { width: 300, height: 600 },
    billboard: { width: 970, height: 250 },
    skyscraper: { width: 160, height: 600 },
    square: { width: 250, height: 250 },
  };
  
  return presets[size.preset] ?? { width: 728, height: 90 };
}

/**
 * Generates text slot application code
 */
function generateTextSlotsCode(spec: AdSpec): string {
  const lines: string[] = [];
  
  // Standard text slots
  const standardSlots = ['headline', 'subheadline', 'body', 'cta'] as const;
  
  for (const slot of standardSlots) {
    const value = spec.text[slot];
    if (value?.value) {
      const runName = `TEXT_${slot.toUpperCase()}`;
      const escapedValue = value.value.replace(/'/g, "\\'").replace(/\n/g, '\\n');
      lines.push(`      try { r.setTextRunValue('${runName}', '${escapedValue}'); } catch(e) {}`);
    }
  }
  
  // Custom text slots
  if (spec.text.custom) {
    for (const [key, value] of Object.entries(spec.text.custom)) {
      if (value?.value) {
        const runName = `TEXT_${key.toUpperCase()}`;
        const escapedValue = value.value.replace(/'/g, "\\'").replace(/\n/g, '\\n');
        lines.push(`      try { r.setTextRunValue('${runName}', '${escapedValue}'); } catch(e) {}`);
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Generates state machine inputs application code
 */
function generateStateInputsCode(spec: AdSpec): string {
  const lines: string[] = [];
  const { stateInputs, template } = spec;
  
  lines.push(`      try {`);
  lines.push(`        const inputs = r.stateMachineInputs('${template.stateMachine}');`);
  lines.push(`        if (inputs) {`);
  
  if (stateInputs.speed !== undefined) {
    lines.push(`          const speedInput = inputs.find(i => i.name === 'speed');`);
    lines.push(`          if (speedInput) speedInput.value = ${stateInputs.speed};`);
  }
  
  if (stateInputs.intensity !== undefined) {
    lines.push(`          const intensityInput = inputs.find(i => i.name === 'intensity');`);
    lines.push(`          if (intensityInput) intensityInput.value = ${stateInputs.intensity};`);
  }
  
  if (stateInputs.mood) {
    lines.push(`          const moodInput = inputs.find(i => i.name === 'mood_${stateInputs.mood}');`);
    lines.push(`          if (moodInput) moodInput.value = true;`);
  }
  
  if (stateInputs.custom) {
    for (const [name, value] of Object.entries(stateInputs.custom)) {
      lines.push(`          const customInput_${name} = inputs.find(i => i.name === '${name}');`);
      lines.push(`          if (customInput_${name}) customInput_${name}.value = ${JSON.stringify(value)};`);
    }
  }
  
  lines.push(`        }`);
  lines.push(`      } catch(e) {}`);
  
  return lines.join('\n');
}

/**
 * Generates color binding code via ViewModel
 */
function generateColorBindingsCode(spec: AdSpec): string {
  if (!spec.colors?.background) return '';
  
  const hex = spec.colors.background;
  const lines: string[] = [];
  
  lines.push(`      try {`);
  lines.push(`        const vm = r.viewModelByName('AdViewModel');`);
  lines.push(`        if (vm) {`);
  lines.push(`          const instance = vm.defaultInstance();`);
  lines.push(`          if (instance) {`);
  lines.push(`            r.bindViewModelInstance(instance);`);
  lines.push(`            const bgColor = instance.color('bgColor');`);
  lines.push(`            if (bgColor) {`);
  lines.push(`              const hex = '${hex}';`);
  lines.push(`              const r2 = parseInt(hex.slice(1,3), 16);`);
  lines.push(`              const g = parseInt(hex.slice(3,5), 16);`);
  lines.push(`              const b = parseInt(hex.slice(5,7), 16);`);
  lines.push(`              bgColor.rgb(r2, g, b);`);
  lines.push(`            }`);
  lines.push(`          }`);
  lines.push(`        }`);
  lines.push(`      } catch(e) {}`);
  
  return lines.join('\n');
}

/**
 * Generates a complete self-contained HTML file with Rive animation
 * 
 * @param spec - AdSpec configuration
 * @param rivFileName - Filename of the .riv file (e.g., 'test-template.riv')
 * @returns Complete HTML string ready for download
 */
export function generateEmbedHtml(spec: AdSpec, rivFileName: string): string {
  const dimensions = getAdDimensions(spec.format?.size ?? { preset: 'leaderboard' });
  const headline = spec.text.headline?.value ?? 'Ad';
  const brand = spec.generation?.prompt ?? 'RiveAds';
  
  const textSlots = generateTextSlotsCode(spec);
  const stateInputs = generateStateInputsCode(spec);
  const colorBindings = generateColorBindingsCode(spec);
  
  return `<!DOCTYPE html>
<!-- RiveAds Studio Export
     To use: place test-template.riv in the same folder as this file
     and serve via HTTP server (not file://) -->
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline} — ${brand}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${dimensions.width}px; height: ${dimensions.height}px; overflow: hidden; }
    canvas { display: block; width: ${dimensions.width}px; height: ${dimensions.height}px; }
  </style>
</head>
<body>
  <canvas id="rive-canvas" width="${dimensions.width}" height="${dimensions.height}"></canvas>
  <script src="https://unpkg.com/@rive-app/canvas@latest/rive.js"></script>
  <script>
    const r = new rive.Rive({
      src: '${rivFileName}',
      canvas: document.getElementById('rive-canvas'),
      artboard: '${spec.template.artboard}',
      stateMachines: ['${spec.template.stateMachine}'],
      autoplay: true,
      onLoad: () => {
        r.resizeDrawingSurfaceToCanvas();
        applyAdSpec();
      }
    });

    function applyAdSpec() {
      // Text slots
${textSlots}
      
      // State machine inputs
${stateInputs}
      
      // Colors via ViewModel
${colorBindings}
    }
  </script>
</body>
</html>`;
}
