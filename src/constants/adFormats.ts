export const AD_FORMATS = [
  {
    id: 'leaderboard',
    label: '728×90',
    width: 728,
    height: 90,
    preset: 'leaderboard',
    riveFile: '/templates/banner-728x90.riv',
    artboard: 'Banner 728x90'
  },
  {
    id: 'medium-rectangle',
    label: '300×250',
    width: 300,
    height: 250,
    preset: 'medium-rectangle',
    riveFile: '/templates/banner-300x250.riv',
    artboard: 'Banner 300x250'
  },
  {
    id: 'half-page',
    label: '300×600',
    width: 300,
    height: 600,
    preset: 'half-page',
    riveFile: '/templates/banner-300x600.riv',
    artboard: 'Banner 300x600'
  },
  {
    id: 'billboard',
    label: '970×250',
    width: 970,
    height: 250,
    preset: 'billboard',
    riveFile: '/templates/banner-970x250.riv',
    artboard: 'Banner 970x250'
  },
  {
    id: 'mobile-banner',
    label: '320×50',
    width: 320,
    height: 50,
    preset: 'mobile-banner',
    riveFile: '/templates/banner-320x50.riv',
    artboard: 'Banner 320x50'
  },
  {
    id: 'social-square',
    label: '1080×1080',
    width: 1080,
    height: 1080,
    preset: 'social-square',
    riveFile: '/templates/social-1080x1080.riv',
    artboard: 'Banner 300x250'
  },
  {
    id: 'social-landscape',
    label: '1200×628',
    width: 1200,
    height: 628,
    preset: 'social-landscape',
    riveFile: '/templates/social-1200x628.riv',
    artboard: 'Banner 300x250'
  },
  {
    id: 'social-story',
    label: '1080×1920',
    width: 1080,
    height: 1920,
    preset: 'social-story',
    riveFile: '/templates/social-1080x1920.riv',
    artboard: 'Banner 300x250'
  }
] as const

export type AdFormatId = typeof AD_FORMATS[number]['id']
export type AdFormat = typeof AD_FORMATS[number]
export const DEFAULT_FORMAT = AD_FORMATS.find(f => f.id === 'medium-rectangle')!
