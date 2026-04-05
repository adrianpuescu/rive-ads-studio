import { AD_FORMATS } from '../constants/adFormats'
import type { AdSpec } from '../types/ad-spec.schema'

/**
 * Resolved pixel size of the creative for tilt / preview heuristics.
 * Prefer over thumbnail image dimensions — captures may be uniform aspect regardless of format.
 */
export function getCreativeDimensionsFromAdSpec(
  spec: AdSpec | null | undefined
): { width: number; height: number } | null {
  if (!spec) return null

  const size = spec.format?.size
  if (size && 'width' in size && typeof size.width === 'number' && typeof size.height === 'number') {
    if (size.width > 0 && size.height > 0) {
      return { width: size.width, height: size.height }
    }
  }

  if (spec.formatId) {
    const fmt = AD_FORMATS.find((f) => f.id === spec.formatId)
    if (fmt) return { width: fmt.width, height: fmt.height }
  }

  return null
}
