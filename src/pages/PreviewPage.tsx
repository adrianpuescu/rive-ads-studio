/**
 * PreviewPage — public preview page for shared ads.
 * No authentication required.
 */

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AdCanvas } from '../components/AdCanvas'
import { fetchAdByShareToken, type Ad } from '../hooks/useAds'
import { AD_FORMATS, DEFAULT_FORMAT } from '../constants/adFormats'
import { PageLoader } from '../components/PageLoader'

type LoadingState = 'loading' | 'success' | 'error' | 'not-found'

export function PreviewPage() {
  const { token } = useParams<{ token: string }>()
  const [ad, setAd] = useState<Ad | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')

  useEffect(() => {
    console.log('PreviewPage mounted, token:', token)
    
    if (!token) {
      setLoadingState('not-found')
      return
    }

    let cancelled = false
    setLoadingState('loading')

    const fetchAd = async () => {
      try {
        const result = await fetchAdByShareToken(token)
        console.log('fetch result:', result)
        if (cancelled) return
        if (result) {
          setAd(result)
          setLoadingState('success')
        } else {
          setLoadingState('not-found')
        }
      } catch (err) {
        console.error('[PreviewPage] fetch error:', err)
        if (!cancelled) {
          setLoadingState('error')
        }
      }
    }

    void fetchAd()

    return () => {
      cancelled = true
    }
  }, [token])

  const format = ad?.adSpec?.formatId
    ? AD_FORMATS.find((f) => f.id === ad.adSpec?.formatId) ?? DEFAULT_FORMAT
    : DEFAULT_FORMAT

  if (loadingState === 'loading') {
    return <PageLoader message="Loading preview…" />
  }

  if (loadingState === 'not-found') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header projectName={null} />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Preview not found</h1>
            <p className="text-sm text-gray-500 mb-4">
              This preview link may have expired or is invalid.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm px-4 py-2 rounded hover:bg-gray-700 no-underline transition-colors duration-150"
            >
              Go to RiveAds Studio
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (loadingState === 'error') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header projectName={null} />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-4">
              We couldn't load this preview. Please try again later.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm px-4 py-2 rounded hover:bg-gray-700 border-0 cursor-pointer transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!ad?.adSpec) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header projectName={null} />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">No content available</h1>
            <p className="text-sm text-gray-500">
              This ad doesn't have any content to preview.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const projectName = ad.headline || ad.adSpec.name || 'Untitled'

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header projectName={projectName} />
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <AdCanvas
          spec={ad.adSpec}
          width={format.width}
          height={format.height}
          riveFile={format.riveFile}
          artboard={format.artboard}
        />
        <p className="mt-4 text-sm text-gray-400">
          {format.label}
        </p>
      </main>
    </div>
  )
}

function Header({ projectName }: { projectName: string | null }) {
  return (
    <header className="h-11 flex-shrink-0 flex items-center px-5 bg-white border-b border-gray-200">
      <div className="flex items-center gap-1.5">
        <span className="font-serif text-sm font-semibold leading-none text-gray-900">RiveAds</span>
        <span className="w-1 h-1 rounded-full bg-gray-900" aria-hidden />
        <span className="font-sans text-sm font-semibold leading-none text-gray-900">Studio</span>
      </div>
      {projectName && (
        <>
          <span className="w-px h-4 bg-gray-200 mx-3" aria-hidden />
          <span className="text-sm text-gray-600 truncate max-w-[300px]">{projectName}</span>
        </>
      )}
    </header>
  )
}
