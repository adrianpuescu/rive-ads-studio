# RiveAds Studio
AI-powered creative studio for generating artistic online ads using Rive animations.

⚠️ Work in progress — experimental MVP

## What this is
A web application that takes a natural language prompt from a brand or advertiser
and generates a polished, animated ad using Rive's animation runtime. Outputs
HTML/JS embeddable ad units, MP4/GIF video, and static image fallbacks.

## Tech stack
- React + TypeScript + Vite
- Rive Web Runtime (@rive-app/canvas)
- Claude API (Anthropic) — AI spec generation

## Project structure
```
src/
  types/         # AdSpec schema — the core data contract
  hooks/         # useAdSpecRenderer — Rive lifecycle management
  lib/           # riveApplier, templateRegistry — pure utilities
  components/    # AdCanvas, AdCanvasDemo — React UI
public/
  templates/     # .riv template files (binary — do not edit as text)
```

## Getting started
```
npm install
npm run dev
```

## Architecture
User prompt → Claude API → AdSpec JSON → Rive runtime → live ad preview → export

See /public/docs for full design specification and technical decisions.

## Status
Technical spike complete. Core AdSpec → Rive rendering pipeline validated.

AI spec generator (Brief #3) in progress.

## Rive templates
Templates must be authored in the Rive editor with named slots:
- Text runs: TEXT_HEADLINE, TEXT_SUBHEADLINE, TEXT_BODY, TEXT_CTA, TEXT_TAGLINE
- State machine inputs: speed (number), intensity (number), mood_* (boolean)
- Asset slots: IMAGE_LOGO, IMAGE_PRODUCT, IMAGE_BG

## Notes
- *.riv files are binary — .gitattributes is configured accordingly
- Rive Cadet plan ($9/mo) required for template exports