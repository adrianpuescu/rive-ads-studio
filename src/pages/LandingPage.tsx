import type { FormEvent } from 'react'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ElasticUniverse } from '../lib/elasticUniverse'

type FormState = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error'

const TYPEWRITER_VARIANTS = [
  { prompt: 'a luxury perfume campaign, elegant', headline: 'Essence Unveiled', sub: 'Where elegance meets mystery' },
  { prompt: 'travel brand, adventurous, coastal', headline: 'Set Sail Today', sub: 'Adventure starts here' },
  { prompt: 'music app, energetic', headline: 'Sound On', sub: 'Music that moves you' },
  { prompt: 'eco brand, calm, natural', headline: 'Breathe Easy', sub: 'Pure air. Pure living.' },
  { prompt: 'fintech, bold, minimal', headline: 'Your Money Moves', sub: 'Spend smarter. Live better.' },
] as const

function ElasticBrandUniverse() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const universe = new ElasticUniverse(canvas)
    universe.start()

    return () => universe.destroy()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

function TypewriterDemo() {
  const [variantIndex, setVariantIndex] = useState(0)
  const [displayedHeadline, setDisplayedHeadline] = useState('')
  const [showSub, setShowSub] = useState(false)
  const [phase, setPhase] = useState<'typing' | 'showing' | 'erasing'>('typing')

  const variant = TYPEWRITER_VARIANTS[variantIndex]

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (phase === 'typing') {
      if (displayedHeadline.length < variant.headline.length) {
        timeout = setTimeout(() => {
          setDisplayedHeadline(variant.headline.slice(0, displayedHeadline.length + 1))
        }, 60)
      } else {
        setShowSub(true)
        setPhase('showing')
      }
    } else if (phase === 'showing') {
      timeout = setTimeout(() => {
        setPhase('erasing')
      }, 2000)
    } else if (phase === 'erasing') {
      if (displayedHeadline.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedHeadline(displayedHeadline.slice(0, -1))
        }, 30)
      } else {
        setShowSub(false)
        setVariantIndex((prev) => (prev + 1) % TYPEWRITER_VARIANTS.length)
        setPhase('typing')
      }
    }

    return () => clearTimeout(timeout)
  }, [phase, displayedHeadline, variant.headline])

  return (
    <div className="mb-12 min-h-[140px]">
      <p className="text-sm text-gray-400 font-mono mb-3">
        "{variant.prompt}"
      </p>
      <p className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 min-h-[36px]">
        {displayedHeadline}
        <span
          className="inline-block w-1 h-7 bg-[#E8521A] ml-1 align-middle"
          style={{ animation: 'blink 1s step-end infinite' }}
        />
      </p>
      <p
        className="text-base text-gray-500 transition-opacity duration-300 min-h-[24px]"
        style={{ opacity: showSub ? 1 : 0 }}
      >
        {variant.sub}
      </p>
    </div>
  )
}

export function LandingPage() {
  const [email, setEmail] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormState('submitting')

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ email: email.trim().toLowerCase() })

      if (error) {
        if (error.code === '23505') {
          setFormState('success')
        } else {
          setFormState('error')
        }
        return
      }

      setFormState('success')
    } catch {
      setFormState('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      <ElasticBrandUniverse />

      <header className="h-11 flex-shrink-0 flex items-center justify-between px-5 bg-white/80 backdrop-blur-sm border-b border-gray-200 relative z-10">
        <Link to="/" className="flex items-center gap-1.5 no-underline text-gray-900">
          <span className="font-serif text-sm font-semibold leading-none">RiveAds</span>
          <span className="w-1 h-1 rounded-full bg-gray-900" aria-hidden />
          <span className="font-sans text-sm font-semibold leading-none">Studio</span>
        </Link>
        <Link
          to="/login"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150 no-underline"
        >
          Sign in
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10 min-h-[80vh]">
        <div
          className="w-full text-center px-14 py-16"
          style={{
            maxWidth: '592px',
            background: 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
            borderRadius: '28px',
          }}
        >
          <span className="inline-block px-4 py-1.5 text-sm font-medium text-primary bg-primary-light rounded-full mb-8">
            Early Access
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-none text-gray-900 mb-10">
            Animated ads,<br />built by AI.
          </h1>

          <TypewriterDemo />

          {formState === 'success' ? (
            <p className="text-base text-gray-900 font-medium">
              You're on the list. We'll be in touch.
            </p>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex gap-3 mb-4 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={formState === 'submitting'}
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-base bg-white/80 backdrop-blur-sm transition-colors duration-150 focus:outline-none focus:border-gray-400 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  className="bg-white border border-gray-200 text-gray-900 rounded-lg px-6 py-3 text-base font-medium hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 whitespace-nowrap"
                >
                  {formState === 'submitting' ? 'Joining...' : 'Join waitlist'}
                </button>
              </form>

              {formState === 'duplicate' && (
                <p className="text-sm text-amber-600 mb-4">Already on the list!</p>
              )}

              {formState === 'error' && (
                <p className="text-sm text-red-500 mb-4">
                  Something went wrong. Try again.
                </p>
              )}

              <p className="text-sm text-gray-400">
                No credit card. No spam. Launch access when ready.
              </p>
            </>
          )}
        </div>
      </main>

      <footer className="py-6 text-center border-t border-gray-200 bg-white/80 backdrop-blur-sm relative z-10">
        <p className="text-xs text-gray-400 m-0">
          © {new Date().getFullYear()} RiveAds Studio. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
