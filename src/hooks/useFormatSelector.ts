import { useState, useRef, useEffect, useCallback } from 'react'
import { AD_FORMATS, DEFAULT_FORMAT, type AdFormat } from '../constants/adFormats'
import type { AdSpec } from '../types/ad-spec.schema'

export function useFormatSelector() {
  const [currentFormat, setCurrentFormat] = useState<AdFormat>(DEFAULT_FORMAT)
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false)
  const formatDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!formatDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target as Node)) {
        setFormatDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [formatDropdownOpen])

  const restoreFormatFromSpec = useCallback((spec: AdSpec) => {
    if (spec.formatId) {
      const format = AD_FORMATS.find((f) => f.id === spec.formatId)
      if (format) {
        setCurrentFormat(format)
        return
      }
    }
    setCurrentFormat(DEFAULT_FORMAT)
  }, [])

  const selectFormat = useCallback((format: AdFormat) => {
    setCurrentFormat(format)
    setFormatDropdownOpen(false)
  }, [])

  const toggleDropdown = useCallback(() => {
    setFormatDropdownOpen((o) => !o)
  }, [])

  return {
    currentFormat,
    setCurrentFormat,
    formatDropdownOpen,
    formatDropdownRef,
    restoreFormatFromSpec,
    selectFormat,
    toggleDropdown,
  }
}
