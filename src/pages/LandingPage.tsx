import type { FormEvent } from 'react'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ElasticUniverse } from '../lib/elasticUniverse'
import '../styles/LandingPage.css'

type FormState = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error'

const TYPEWRITER_VARIANTS = [
  {
    headline: "Any format. In seconds.",
    sub: "All IAB sizes, generated simultaneously.",
  },
  {
    headline: "Ads that react to users.",
    sub: "Clicks, hovers, scroll — no code needed.",
  },
  {
    headline: "Lighter than GIF. Sharper than video.",
    sub: "Vector-based, fraction of the file size.",
  },
  {
    headline: "From brief to live in 60 seconds.",
    sub: "Describe your brand. We handle the rest.",
  },
  {
    headline: "Deploy anywhere ads run.",
    sub: "HTML5 export — any ad server or DSP.",
  },
] as const;

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
        timeout = setTimeout(() => {
          setVariantIndex((prev) => (prev + 1) % TYPEWRITER_VARIANTS.length)
          setPhase('typing')
        }, 300)
      }
    }

    return () => clearTimeout(timeout)
  }, [phase, displayedHeadline, variant.headline])

  return (
    <div className="mb-6" style={{ minHeight: '120px' }}>
      <p className="text-xl font-semibold text-gray-900 mb-2">
        {displayedHeadline}
        <span
          className="inline-block w-1 h-7 bg-[#4F6EF7] ml-1 align-middle"
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
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, active: false })
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => {
        if (count !== null) setWaitlistCount(count)
      })
  }, [])

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

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const rotateX = Math.max(-5, Math.min(5, (e.clientY - cy) / 60))
    const rotateY = Math.max(-5, Math.min(5, -(e.clientX - cx) / 60))
    setTilt({ rotateX, rotateY, active: true })
  }

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, active: false })
  }

  return (
    <div
      className="flex flex-col relative landing-root-bg"
      style={{ minHeight: '100vh' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ElasticBrandUniverse />
      <div className="landing-dot-grid" aria-hidden />

      <header className="h-11 flex-shrink-0 flex items-center justify-between px-5 relative z-10">
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

      <main className="flex-1 flex flex-col items-center justify-center min-h-0 px-6 py-8 md:py-16 relative z-10">
        <div
          ref={cardRef}
          className="hero-card w-full text-center px-6 py-6 md:px-14 md:py-14"
          style={{
            transform: tilt.active
              ? `perspective(1500px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`
              : 'perspective(1500px) rotateX(0deg) rotateY(0deg)',
            transition: tilt.active ? 'transform 0.3s ease-out' : 'transform 0.4s ease-out',
          }}
        >
          <div className="flex flex-col items-center gap-2 mb-6">
            <span className="inline-block px-4 py-1.5 text-sm font-medium text-primary bg-primary-light rounded-full">
              Early Access
            </span>
            <span className="text-xs text-gray-400 hidden md:block">Currently in private beta</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-none text-gray-900 mb-6">
            Animated ads,<br />built by AI.
          </h1>

          <TypewriterDemo />

          {formState === 'success' ? (
            <p className="text-base text-gray-900 font-medium">
              You're on the list. We'll be in touch.
            </p>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={formState === 'submitting'}
                  className="flex-1 w-full border border-gray-200 rounded-lg px-4 py-3 text-base bg-white/80 backdrop-blur-sm transition-colors duration-150 focus:outline-none focus:border-gray-400 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  className="rounded-lg px-6 py-3 text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #5B7FFF 0%, #60CFFF 100%)', color: 'white', border: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
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

              <p className="text-sm text-gray-400 hidden md:block">
                {waitlistCount !== null && waitlistCount >= 50
                  ? `Join ${waitlistCount.toLocaleString()} people already on the waitlist`
                  : 'No credit card. No spam. Launch access when ready.'}
              </p>
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center relative z-10">
        <p className="text-xs text-gray-400 m-0">
          © {new Date().getFullYear()} RiveAds Studio. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
