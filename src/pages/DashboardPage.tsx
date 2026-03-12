import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBrandTokens } from '../hooks/useBrandTokens'
import { useAds } from '../hooks/useAds'
import { STORAGE_KEYS } from '../constants/storageKeys'

interface SupabaseProject {
  id: string
  name: string | null
  updated_at: string | null
  thumbnail_url: string | null
}

function formatUpdatedAt(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { brands } = useBrandTokens()
  const { items: localAds } = useAds()

  const [supabaseProjects, setSupabaseProjects] = useState<SupabaseProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    let cancelled = false
    setProjectsLoading(true)
    setProjectsError(null)

    supabase
      .from<SupabaseProject>('ads')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setProjectsError('Could not load recent projects.')
          setSupabaseProjects([])
          return
        }
        setSupabaseProjects(data ?? [])
      })
      .finally(() => {
        if (!cancelled) {
          setProjectsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
    } finally {
      navigate('/login')
    }
  }

  const handleOpenProjectInEditor = (projectId: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_LOAD, projectId)
    } catch {
      // ignore
    }
    navigate('/editor')
  }

  const userEmail = user?.email ?? ''

  const sortedBrands = useMemo(
    () => [...brands].sort((a, b) => b.createdAt - a.createdAt),
    [brands]
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="h-11 flex-shrink-0 flex items-center px-5 bg-white border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center gap-1.5 no-underline text-gray-900">
          <span className="font-serif text-sm font-semibold leading-none">RiveAds</span>
          <span className="w-1 h-1 rounded-full bg-gray-900" aria-hidden />
          <span className="font-sans text-sm font-semibold leading-none">Studio</span>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-sm text-gray-500 truncate max-w-[220px]">
              {userEmail}
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-900 px-2 py-1 rounded border-0 bg-transparent cursor-pointer transition-colors duration-150"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        <section className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-lg font-semibold text-gray-900 m-0">Dashboard</h1>
          <button
            type="button"
            onClick={() => navigate('/editor')}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3 py-2 rounded hover:bg-gray-700 border-0 cursor-pointer transition-colors duration-150 min-h-[32px]"
          >
            + New project
          </button>
        </section>

        <section aria-labelledby="recent-projects-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="recent-projects-heading"
              className="text-base font-semibold text-gray-900 m-0"
            >
              Recent projects
            </h2>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="text-sm text-gray-500 hover:text-gray-900 px-1 py-0 border-0 bg-transparent cursor-pointer transition-colors duration-150"
            >
              View all →
            </button>
          </div>

          {projectsLoading ? (
            <p className="text-sm text-gray-500">Loading your projects…</p>
          ) : supabaseProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {supabaseProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleOpenProjectInEditor(project.id)}
                  className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 hover:shadow-sm flex flex-col w-full min-h-0 transition-all duration-150"
                >
                  <div className="w-full h-[120px] flex-shrink-0 p-3 flex items-center justify-center bg-gray-50 box-border">
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt=""
                        className="max-w-full max-h-24 object-contain block rounded-md"
                      />
                    ) : (
                      <div className="w-full h-24 rounded-md bg-gray-100" />
                    )}
                  </div>
                  <div className="p-4 pb-3 flex flex-col flex-1 min-h-0 text-left">
                    <h3 className="text-base font-semibold text-gray-900 m-0 mb-1 leading-tight text-left">
                      {project.name ?? 'Untitled project'}
                    </h3>
                    <p className="text-xs text-gray-400 m-0 text-left">
                      {formatUpdatedAt(project.updated_at) || 'Last updated unavailable'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : localAds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {localAds.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenProjectInEditor(item.id)}
                  className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 hover:shadow-sm flex flex-col w-full min-h-0 transition-all duration-150"
                >
                  <div className="w-full h-[120px] flex-shrink-0 p-3 flex items-center justify-center bg-gray-50 box-border">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="max-w-full max-h-24 object-contain block rounded-md"
                      />
                    ) : (
                      <div
                        className="w-full h-24 rounded-md flex-shrink-0"
                        style={{ background: item.colors.background }}
                      />
                    )}
                  </div>
                  <div className="p-4 pb-3 flex flex-col flex-1 min-h-0 text-left">
                    <h3 className="text-base font-semibold text-gray-900 m-0 mb-1 leading-tight text-left">
                      {item.headline || '—'}
                    </h3>
                    <p className="text-sm text-gray-500 m-0 mb-2 leading-tight text-left">
                      {item.subheadline || '—'}
                    </p>
                    <p className="text-xs text-gray-400 italic m-0 mb-3 leading-tight text-left">
                      {item.prompt.length <= 80
                        ? item.prompt
                        : `${item.prompt.slice(0, 80).trim()}…`}
                    </p>
                    <div className="flex gap-1.5 mb-3" aria-hidden>
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-black/10"
                        style={{ background: item.colors.background }}
                      />
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-black/10"
                        style={{ background: item.colors.primary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-black/10"
                        style={{ background: item.colors.headlineColor ?? item.colors.primary }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 m-0 mb-3">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-white px-5 py-6">
              <p className="m-0 text-sm font-medium text-gray-900">No projects yet</p>
              <p className="m-0 text-sm text-gray-500">
                Generate your first ad to get started.
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="brands-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="brands-heading"
              className="text-base font-semibold text-gray-900 m-0"
            >
              Brands
            </h2>
            <button
              type="button"
              onClick={() => navigate('/editor')}
              className="text-sm text-gray-500 hover:text-gray-900 px-1 py-0 border-0 bg-transparent cursor-pointer transition-colors duration-150"
            >
              Manage →
            </button>
          </div>

          {sortedBrands.length === 0 ? (
            <div className="flex flex-col items-start justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-white px-5 py-6">
              <p className="m-0 text-sm font-medium text-gray-900">No brands yet</p>
              <p className="m-0 text-sm text-gray-500">
                Add a brand to keep your ads consistent.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3">
              {sortedBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between gap-3 py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1.5" aria-hidden>
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10"
                        style={{ background: brand.tokens.backgroundColor }}
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10"
                        style={{ background: brand.tokens.primaryColor }}
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10"
                        style={{ background: brand.tokens.secondaryColor }}
                      />
                    </div>
                    <span className="text-sm text-gray-900 truncate">
                      {brand.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 truncate max-w-[160px]">
                    {brand.tokens.fontFamily}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
