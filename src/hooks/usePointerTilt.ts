import type { CSSProperties, MouseEvent as ReactMouseEvent, RefObject } from 'react'
import { useCallback, useMemo, useState } from 'react'

type TiltState = { rotateX: number; rotateY: number; active: boolean }

const DEFAULT_MAX_TILT = 5
const DEFAULT_SENSITIVITY = 60
const PERSPECTIVE_PX = 1500

export type PointerTiltOptions = {
  maxTilt?: number
  sensitivity?: number
  /** Lower = stronger foreshortening (more 3D read). Defaults to 1500 (hero). */
  perspectivePx?: number
}

/** Project card thumbnails: more pronounced than the homepage hero (different hit area / UX). */
export const POINTER_TILT_PROJECT_CARD: PointerTiltOptions = {
  maxTilt: 26,
  sensitivity: 10,
  perspectivePx: 900,
}

const MAX_PROJECT_TILT = 62

/**
 * Landscape thumbnails use the base preset; square/portrait need stronger tilt because
 * `object-contain` letterboxing makes motion read much flatter in the preview strip.
 *
 * Prefer `creativeSize` from AdSpec — thumbnail PNGs are often similar aspect for every
 * export; creative width/height reflects the real format (square, story, etc.).
 */
export function projectCardTiltOptionsForAspect(
  naturalWidth: number | null,
  naturalHeight: number | null,
  creativeSize?: { width: number; height: number } | null
): PointerTiltOptions {
  const base = POINTER_TILT_PROJECT_CARD
  const maxT = base.maxTilt ?? 26
  const sens = base.sensitivity ?? 10
  const persp = base.perspectivePx ?? 900

  const applyBoost = (boost: number): PointerTiltOptions => ({
    ...base,
    maxTilt: Math.min(MAX_PROJECT_TILT, Math.round(maxT * boost)),
    sensitivity: Math.max(3, Math.round(sens / boost)),
    perspectivePx: Math.max(480, Math.round(persp - (boost - 1) * 125)),
  })

  let aspect: number | null = null
  if (creativeSize && creativeSize.width > 0 && creativeSize.height > 0) {
    aspect = creativeSize.width / creativeSize.height
  } else if (naturalWidth && naturalHeight && naturalWidth > 0 && naturalHeight > 0) {
    aspect = naturalWidth / naturalHeight
  }

  if (aspect == null) {
    return applyBoost(1.55)
  }

  let boost = 1
  if (aspect >= 1.45) {
    boost = 1
  } else if (aspect >= 1.2) {
    boost = 1.18
  } else if (aspect >= 1.02) {
    boost = 1.42
  } else if (aspect >= 0.88) {
    boost = 1.65
  } else if (aspect >= 0.65) {
    boost = 2
  } else {
    boost = 2.35
  }

  return applyBoost(boost)
}

/**
 * 3D tilt driven by pointer position vs `boundsRef` (hero card, thumbnail strip, etc.).
 * Reuses the same behavior as the landing page hero card.
 */
export function usePointerTilt(
  boundsRef: RefObject<HTMLElement | null>,
  options?: PointerTiltOptions
) {
  const maxTilt = options?.maxTilt ?? DEFAULT_MAX_TILT
  const sensitivity = options?.sensitivity ?? DEFAULT_SENSITIVITY
  const perspectivePx = options?.perspectivePx ?? PERSPECTIVE_PX

  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0, active: false })

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      const el = boundsRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const rotateX = Math.max(-maxTilt, Math.min(maxTilt, (e.clientY - cy) / sensitivity))
      const rotateY = Math.max(-maxTilt, Math.min(maxTilt, -(e.clientX - cx) / sensitivity))
      setTilt({ rotateX, rotateY, active: true })
    },
    [boundsRef, maxTilt, sensitivity]
  )

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, active: false })
  }, [])

  const tiltStyle = useMemo((): CSSProperties => {
    return {
      transform: tilt.active
        ? `perspective(${perspectivePx}px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`
        : `perspective(${perspectivePx}px) rotateX(0deg) rotateY(0deg)`,
      transition: tilt.active ? 'transform 0.3s ease-out' : 'transform 0.4s ease-out',
    }
  }, [tilt, perspectivePx])

  return { tiltStyle, handleMouseMove, handleMouseLeave }
}
