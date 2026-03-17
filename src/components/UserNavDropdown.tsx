import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, User, LogOut } from 'lucide-react'
import type { User as AuthUser } from '@supabase/supabase-js'

export interface UserNavDropdownProps {
  user: AuthUser
  displayName: string | null
  onSignOut: () => void
}

export function UserNavDropdown({ user, displayName, onSignOut }: UserNavDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const label = (displayName?.trim() || user.email) ?? ''

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 px-2 py-1.5 rounded border-0 bg-transparent cursor-pointer transition-colors duration-150 focus:outline-none focus:bg-gray-50 max-w-[220px] min-w-0"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-hidden />
      </button>
      {open && (
        <ul
          className="absolute top-[calc(100%+4px)] right-0 min-w-[160px] m-0 py-1 list-none bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          role="menu"
          aria-label="User menu"
        >
          <li role="none">
            <Link
              to="/profile"
              role="menuitem"
              className="flex items-center gap-2 w-full py-2 px-3 text-sm text-gray-700 bg-transparent border-0 rounded-none cursor-pointer text-left hover:bg-gray-50 transition-colors duration-150 no-underline"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
              }}
            >
              <User className="w-3.5 h-3.5 text-gray-500" aria-hidden />
              Profile
            </Link>
          </li>
          <li role="none" className="border-t border-gray-100">
            <button
              type="button"
              role="menuitem"
              className="flex items-center gap-2 w-full py-2 px-3 text-sm text-gray-700 bg-transparent border-0 rounded-none cursor-pointer text-left hover:bg-gray-50 transition-colors duration-150"
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500" aria-hidden />
              Sign out
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
