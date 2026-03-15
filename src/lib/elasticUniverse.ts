// ElasticUniverse.ts
// Drop-in replacement — import and use in LandingPage.tsx
// Usage: const eu = new ElasticUniverse(canvas); eu.start(); // cleanup: eu.destroy();

interface Blob {
  // Anchor (home) position as fraction of canvas size — recalculated on resize
  ax: number; // 0..1
  ay: number; // 0..1
  // IAB format base dimensions at scale=1 (viewport 900px reference)
  baseW: number;
  baseH: number;
  // Scaled dimensions — updated on resize
  w: number;
  h: number;
  // Current center position
  x: number;
  y: number;
  // Velocity
  vx: number;
  vy: number;
  // Slow drift: raw anchor-fraction per frame (applied directly, no multiplier)
  dvx: number;
  dvy: number;
  // Depth layer: 0=background, 1=mid, 2=foreground
  layer: 0 | 1 | 2;
  layerScale: number; // size multiplier for this layer
  // Color
  color: string;
  opacity: number;
  opacityMin: number;
  opacityMax: number;
  opacityPhase: number;
  opacitySpeed: number;
  currentOpacity: number;
  // Per-corner deformation toward mouse (gum stretch)
  // corners: TL, TR, BR, BL — each is [dx, dy]
  corners: [number, number][];
  cornerVx: number[];
  cornerVy: number[];
  // Border radius
  radius: number;
}

const SHAPE_COUNT = 12 + Math.floor(Math.random() * 3); // 12–14

// IAB-inspired base dimensions at reference viewport 900px (scaled at runtime)
const FORMATS = [
  { w: 260, h: 72  },  // Leaderboard 728x90
  { w: 169, h: 140 },  // Medium Rectangle 300x250
  { w: 98,  h: 234 },  // Half Page 300x600
  { w: 221, h: 34  },  // Mobile Banner 320x50
];

const PALETTE = [
  { color: '#a5b4fc', opacity: 0.33 }, // indigo deschis
  { color: '#bfdbfe', opacity: 0.46 }, // blue foarte deschis
  { color: '#c4b5fd', opacity: 0.32 }, // violet
  { color: '#e0d7ff', opacity: 0.50 }, // lavender pale
  { color: '#93c5fd', opacity: 0.37 }, // sky blue
];

// Spring physics constants — tweak here
const STIFFNESS = 0.032;       // how strongly blobs return home
const FRICTION  = 0.80;        // damping (lower = more oscillation/overshoot)
const CORNER_STIFFNESS = 0.06; // how strongly corners return to rect shape
const CORNER_FRICTION  = 0.76; // corner damping (lower = more gum-like stretch)
const MOUSE_REPEL_RADIUS = 160;// px — distance at which mouse starts pushing
const MOUSE_REPEL_FORCE  = 6;  // strength of repulsion
const CORNER_ATTRACT_RADIUS = 200; // px from corner — gum stretch range
const CORNER_ATTRACT_FORCE  = 0.08; // how strongly corners stretch toward mouse

/**
 * Generate `count` anchors from a 4×3 grid so blobs spread uniformly.
 * Each cell contributes one position with random jitter inside it.
 * Extra blobs beyond 12 get a random fallback position.
 */
function gridAnchors(count: number): { ax: number; ay: number }[] {
  const COLS = 4, ROWS = 3;
  const cells: { ax: number; ay: number }[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Jitter 10–90% within cell to avoid sticking to grid lines
      const ax = (col + 0.1 + Math.random() * 0.8) / COLS;
      const ay = (row + 0.1 + Math.random() * 0.8) / ROWS;
      cells.push({ ax, ay });
    }
  }
  // Shuffle
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  // Fill extras beyond 12 with random positions
  while (cells.length < count) {
    cells.push({ ax: 0.05 + Math.random() * 0.9, ay: 0.05 + Math.random() * 0.9 });
  }
  return cells.slice(0, count);
}

export class ElasticUniverse {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private blobs: Blob[] = [];
  private mouse = { x: -9999, y: -9999 };
  private raf = 0;
  private t = 0;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundResize: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundResize = this.onResize.bind(this);
    this.resize();
    this.initBlobs();
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('resize', this.boundResize);
  }

  private viewScale(): number {
    return Math.min(window.innerWidth, window.innerHeight) / 900;
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.blobs.length) {
      const scale = this.viewScale();
      this.blobs.forEach(b => {
        b.w = b.baseW * scale * b.layerScale;
        b.h = b.baseH * scale * b.layerScale;
        b.x = b.ax * this.canvas.width;
        b.y = b.ay * this.canvas.height;
      });
    }
  }

  private onResize() {
    this.resize();
  }

  private onMouseMove(e: MouseEvent) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  private initBlobs() {
    const viewScale = this.viewScale();
    const anchors = gridAnchors(SHAPE_COUNT);

    // Assign layer indices: 30% layer 0, 50% layer 1, 20% layer 2
    const layerAssignments: (0 | 1 | 2)[] = Array.from({ length: SHAPE_COUNT }, (_, i) => {
      const t = i / SHAPE_COUNT;
      return t < 0.30 ? 0 : t < 0.80 ? 1 : 2;
    });
    // Shuffle layer assignments so layers aren't just contiguous
    for (let i = layerAssignments.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [layerAssignments[i], layerAssignments[j]] = [layerAssignments[j], layerAssignments[i]];
    }

    this.blobs = Array.from({ length: SHAPE_COUNT }, (_, i) => {
      const fmt = FORMATS[i % FORMATS.length];
      const { ax, ay } = anchors[i];
      const x = ax * window.innerWidth;
      const y = ay * window.innerHeight;
      const layer = layerAssignments[i];

      // Per-layer: size scale, drift speed
      let layerScale: number, driftMag: number;
      if (layer === 0) {
        layerScale = 0.575 + Math.random() * 0.23;
        driftMag   = 0.00001 + Math.random() * 0.000006;
      } else if (layer === 1) {
        layerScale = 0.92 + Math.random() * 0.23;
        driftMag   = 0.000015 + Math.random() * 0.00001;
      } else {
        layerScale = 1.265 + Math.random() * 0.345;
        driftMag   = 0.000022 + Math.random() * 0.000008;
      }
      const { color, opacity } = PALETTE[i % PALETTE.length];

      return {
        ax, ay,
        baseW: fmt.w, baseH: fmt.h,
        w: fmt.w * viewScale * layerScale,
        h: fmt.h * viewScale * layerScale,
        x, y,
        vx: 0, vy: 0,
        dvx: driftMag * (Math.random() < 0.5 ? 1 : -1),
        dvy: driftMag * (Math.random() < 0.5 ? 1 : -1),
        layer,
        layerScale,
        color,
        opacity,
        opacityMin: opacity * (0.3 + Math.random() * 0.3),
        opacityMax: opacity,
        opacityPhase: Math.random() * Math.PI * 2,
        opacitySpeed: 0.1 + Math.random() * 0.8,
        currentOpacity: opacity,
        corners: [[0,0],[0,0],[0,0],[0,0]],
        cornerVx: [0,0,0,0],
        cornerVy: [0,0,0,0],
        radius: 12,
      } as Blob;
    });

    // Sort so layer 0 is drawn first, layer 2 last
    this.blobs.sort((a, b) => a.layer - b.layer);
  }

  private update() {
    this.t += 0.016;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    this.blobs.forEach(b => {
      // Drift anchor slowly across screen; bounce off edges
      b.ax += b.dvx;
      b.ay += b.dvy;
      if (b.ax < 0.05 && b.dvx < 0) b.dvx *= -1;
      if (b.ax > 0.95 && b.dvx > 0) b.dvx *= -1;
      if (b.ay < 0.05 && b.dvy < 0) b.dvy *= -1;
      if (b.ay > 0.95 && b.dvy > 0) b.dvy *= -1;

      // Spring target: drifting anchor only
      const targetX = b.ax * cw;
      const targetY = b.ay * ch;

      // Spring toward float target
      b.vx += (targetX - b.x) * STIFFNESS;
      b.vy += (targetY - b.y) * STIFFNESS;

      // Mouse repulsion from center
      const dx = b.x - this.mouse.x;
      const dy = b.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < MOUSE_REPEL_RADIUS) {
        const force = (1 - dist / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_FORCE;
        b.vx += (dx / dist) * force;
        b.vy += (dy / dist) * force;
      }

      // Friction & integrate
      b.vx *= FRICTION;
      b.vy *= FRICTION;
      b.x += b.vx;
      b.y += b.vy;

      // Corner gum stretch toward mouse
      // Corner world positions (before deformation)
      const corners = [
        [b.x - b.w/2, b.y - b.h/2], // TL
        [b.x + b.w/2, b.y - b.h/2], // TR
        [b.x + b.w/2, b.y + b.h/2], // BR
        [b.x - b.w/2, b.y + b.h/2], // BL
      ];
      corners.forEach((c, i) => {
        const cdx = this.mouse.x - c[0];
        const cdy = this.mouse.y - c[1];
        const cdist = Math.sqrt(cdx*cdx + cdy*cdy) || 1;
        if (cdist < CORNER_ATTRACT_RADIUS) {
          // Attract corner toward mouse — gum stretch
          const force = Math.pow(1 - cdist / CORNER_ATTRACT_RADIUS, 1.8) * CORNER_ATTRACT_FORCE;
          b.cornerVx[i] += cdx * force;
          b.cornerVy[i] += cdy * force;
        }
        // Spring corner back to zero offset
        b.cornerVx[i] += (0 - b.corners[i][0]) * CORNER_STIFFNESS;
        b.cornerVy[i] += (0 - b.corners[i][1]) * CORNER_STIFFNESS;
        b.cornerVx[i] *= CORNER_FRICTION;
        b.cornerVy[i] *= CORNER_FRICTION;
        b.corners[i][0] += b.cornerVx[i];
        b.corners[i][1] += b.cornerVy[i];
        // Clamp corner offset to 30% of shape dimension per axis
        b.corners[i][0] = Math.max(-b.w * 0.3, Math.min(b.w * 0.3, b.corners[i][0]));
        b.corners[i][1] = Math.max(-b.h * 0.3, Math.min(b.h * 0.3, b.corners[i][1]));
      });

      b.currentOpacity = b.opacityMin +
        (b.opacityMax - b.opacityMin) *
        (0.5 + 0.5 * Math.sin(this.t * b.opacitySpeed + b.opacityPhase));
    });
  }

  private drawBlob(b: Blob) {
    const ctx = this.ctx;
    // Base corners
    const cx = b.x, cy = b.y, hw = b.w/2, hh = b.h/2;
    // TL, TR, BR, BL with deformation
    const TL = [cx - hw + b.corners[0][0], cy - hh + b.corners[0][1]];
    const TR = [cx + hw + b.corners[1][0], cy - hh + b.corners[1][1]];
    const BR = [cx + hw + b.corners[2][0], cy + hh + b.corners[2][1]];
    const BL = [cx - hw + b.corners[3][0], cy + hh + b.corners[3][1]];

    // Draw as bezier path with rounded corners via cubic bezier
    // Each corner uses a small arc approximated by bezier
    const r = b.radius;

    ctx.beginPath();
    // Top edge: TL → TR
    ctx.moveTo(TL[0] + r, TL[1]);
    ctx.lineTo(TR[0] - r, TR[1]);
    // TR corner
    ctx.quadraticCurveTo(TR[0], TR[1], TR[0], TR[1] + r);
    // Right edge: TR → BR
    ctx.lineTo(BR[0], BR[1] - r);
    // BR corner
    ctx.quadraticCurveTo(BR[0], BR[1], BR[0] - r, BR[1]);
    // Bottom edge: BR → BL
    ctx.lineTo(BL[0] + r, BL[1]);
    // BL corner
    ctx.quadraticCurveTo(BL[0], BL[1], BL[0], BL[1] - r);
    // Left edge: BL → TL
    ctx.lineTo(TL[0], TL[1] + r);
    // TL corner
    ctx.quadraticCurveTo(TL[0], TL[1], TL[0] + r, TL[1]);
    ctx.closePath();

    ctx.globalAlpha = b.currentOpacity;
    ctx.fillStyle = b.color;
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.blobs.forEach(b => this.drawBlob(b));
  }

  private loop() {
    this.update();
    this.draw();
    this.raf = requestAnimationFrame(this.loop.bind(this));
  }

  start() {
    this.loop();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('resize', this.boundResize);
  }
}