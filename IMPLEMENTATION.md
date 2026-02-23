# Core Rive Rendering Implementation

## Overview
Implemented the core Rive rendering system that takes an AdSpec and applies all its slots to a live Rive instance on a canvas.

## Files Created

### 1. `src/types/ad-spec.schema.ts` (70 lines)
- Canonical AdSpec TypeScript interface
- Defines template reference, text slots, state machine inputs, colors, and assets
- Fully typed with JSDoc documentation

### 2. `src/lib/templateRegistry.ts` (21 lines)
- Maps template IDs to .riv file paths
- `getTemplatePath()` function with error handling for unknown templates
- Currently includes `test-template` mapping

### 3. `src/lib/riveApplier.ts` (168 lines)
- Pure utility function (no React dependencies)
- `applyAdSpec()` applies AdSpec configuration to live Rive instance
- Implements:
  - ✅ TEXT slots - maps spec keys to TEXT_* run names (uppercased)
  - ✅ STATE MACHINE inputs - applies speed, intensity, mood, and custom inputs
  - 📝 COLOR slots - deferred (needs @rive-app/canvas-advanced)
  - 📝 ASSET slots - deferred (needs assetLoader callback)
- Graceful error handling with console.warn for missing inputs
- Never throws - only logs warnings

### 4. `src/hooks/useAdSpecRenderer.ts` (131 lines)
- React hook managing Rive instance lifecycle
- Manual Rive instantiation (not using useRive hook for precise control)
- Features:
  - Loading state management
  - Error state tracking
  - Automatic cleanup on unmount/spec change
  - Calls `resizeDrawingSurfaceToCanvas()` on load
  - Async error handling for `applyAdSpec()`
- Returns: `{ isLoading, error, riveInstance }`

### 5. `src/components/AdCanvas.tsx` + `AdCanvas.css` (53 lines + styles)
- Thin wrapper component
- Props: `spec`, `width`, `height`, `className`
- Renders:
  - Canvas element with ref
  - Loading overlay ("Generating...")
  - Error overlay with message
- Styled with centered overlays

### 6. `src/components/AdCanvasDemo.tsx` (65 lines)
- Demo component with hardcoded test AdSpec
- Shows example usage with:
  - Template: `test-template`
  - Artboard: `default`
  - State Machine: `State Machine 1`
  - Text: headline, subheadline, cta, brand
  - Colors: primary (#e84b2a), secondary, background, textColor
  - State inputs: speed, intensity, mood
- Includes requirements documentation

## Architecture Decisions

1. **Separation of Concerns**
   - `riveApplier.ts` - Pure utility, framework-agnostic
   - `useAdSpecRenderer.ts` - React-specific lifecycle management
   - `AdCanvas.tsx` - Presentational component

2. **Manual Rive Control**
   - Not using `@rive-app/react-canvas` `useRive` hook
   - Needed manual control over when `applyAdSpec` fires
   - Ensures proper sequencing: load → resize → apply

3. **Error Handling Strategy**
   - Hook level: Error state for loading/instantiation failures
   - Applier level: console.warn for missing SM inputs (non-fatal)
   - Never throws - graceful degradation

4. **TypeScript Strict Mode**
   - All files strictly typed
   - No `any` types used
   - Build passes with zero errors

## File Size Compliance
All files under 200 lines:
- `ad-spec.schema.ts`: 70 lines ✅
- `templateRegistry.ts`: 21 lines ✅
- `riveApplier.ts`: 168 lines ✅
- `useAdSpecRenderer.ts`: 131 lines ✅
- `AdCanvas.tsx`: 53 lines ✅
- `AdCanvasDemo.tsx`: 65 lines ✅

## Testing

### Build Status
✅ TypeScript compilation: PASS (0 errors)
✅ Linter: PASS (0 errors)
✅ Dev server: Running on http://localhost:5173/

### Demo Integration
- `AdCanvasDemo` wired into `App.tsx`
- Renders 728x90 banner format
- Shows loading states and error handling

## Next Steps

To test with a real Rive file:

1. Create a .riv file with:
   - Artboard named "default"
   - State Machine named "State Machine 1"
   - Text runs: `TEXT_HEADLINE`, `TEXT_SUBHEADLINE`, `TEXT_CTA`, `TEXT_BRAND`
   - Number inputs: `speed`, `intensity`
   - Boolean input: `mood_energetic`

2. Place it at: `public/templates/test-template.riv`

3. Run: `npm run dev`

4. Open: http://localhost:5173/

## Future Tasks

1. **Color Slots** (requires `@rive-app/canvas-advanced`)
   - Install `@rive-app/canvas-advanced`
   - Create `src/lib/colorApplier.ts`
   - Integrate low-level color API

2. **Asset Slots**
   - Implement assetLoader callback
   - Handle image/font loading
   - Decode and apply assets via `decodeImage()`, `decodeFont()`

3. **Multiple Templates**
   - Add more templates to `TEMPLATE_REGISTRY`
   - Create template selector UI

## Acceptance Criteria Status

✅ Zero TypeScript errors in strict mode
✅ Rive instance always cleaned up on unmount
✅ applyAdSpec never throws - only console.warns
✅ No hardcoded template paths outside templateRegistry.ts
✅ Each file under 200 lines
✅ Demo component created and integrated
