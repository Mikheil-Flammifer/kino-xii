import { ChevronDown, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function getInitials(user) {
  if (!user) {
    return ''
  }

  const username =
    user.username ||
    user.name ||
    ''

  const parts = username
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return username.slice(0, 2).toUpperCase()
}

export default function Navbar() {
  const {
    user,
    isAuthenticated,
    openModal,
    logout,
  } = useAuth()

  const profileComplete =
    Boolean(user?.name) &&
    Boolean(user?.mobile) &&
    Boolean(user?.date_of_birth)

  return (
    <header className="absolute left-0 top-0 z-50 w-full">
      <nav className="mx-auto flex h-[111px] max-w-[1728px] items-start justify-between bg-gradient-to-b from-black via-black/50 to-transparent px-[60px] pt-[30px]">
        {/* LEFT */}
        <div className="flex h-[22px] items-center gap-[36px]">
          <Link
            to="/"
            className="flex h-[22px] items-center gap-[6px]"
          >
            <span className="text-[20px] font-extrabold leading-[22px] text-white">
              KINO
            </span>

            <span className="text-[20px] font-extrabold leading-[22px] text-[#EC3013]">
              XII
            </span>
          </Link>

          <Link
            to="/sessions"
            className="text-[12px] font-semibold leading-[13px] tracking-[0.06em] text-white"
          >
            SESSIONS
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex h-[41px] items-center gap-[32px]">
          {/* SEARCH */}
          <div className="flex h-[41px] w-[380px] items-center gap-1 rounded-full bg-white/10 px-3">
            <Search
              size={14}
              strokeWidth={1}
              className="shrink-0 text-white"
            />

            <input
              type="text"
              placeholder="Search films and live events"
              className="min-w-0 flex-1 bg-transparent text-[14px] leading-[18px] text-white outline-none placeholder:text-white"
            />
          </div>

          {/* UNAUTHENTICATED */}
          {!isAuthenticated && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openModal('login')}
                className="flex h-[41px] w-[96px] items-center justify-center rounded-full bg-[#EC3013] text-[14px] font-extrabold text-white"
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() => openModal('register')}
                className="flex h-[41px] w-[86px] items-center justify-center rounded-full bg-white text-[14px] font-extrabold text-[#070C1C]"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* AUTHENTICATED */}
          {isAuthenticated && user && (
            <button
              type="button"
              onClick={() => openModal('profile')}
              className="flex h-[40px] items-center gap-[24px]"
              aria-label="Open profile"
            >
              <div className="flex h-[40px] items-center gap-3">
                {/* AVATAR */}
                <div className="relative h-[40px] w-[40px] overflow-visible">
                  {profileComplete && user.avatar_url ? (
                    <div
                      className="h-[40px] w-[40px] rounded-[8px] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${user.avatar_url})`,
                      }}
                    />
                  ) : (
                    <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[8px] bg-[#1E2031] text-[12px] font-semibold leading-[13px] text-white">
                      {getInitials(user)}
                    </div>
                  )}

                  {/* STATUS DOT */}
                  <span
                    className={`absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full border border-[#070C1C] ${
                      profileComplete
                        ? 'bg-[#4ADE80]'
                        : 'bg-[#E27E04]'
                    }`}
                  />
                </div>

                {/* USERNAME */}
                <span className="max-w-[80px] truncate text-[14px] font-semibold leading-[15px] text-white">
                  {user.username || user.name}
                </span>
              </div>

              <ChevronDown
                size={16}
                strokeWidth={2}
                className="text-white"
              />
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}

