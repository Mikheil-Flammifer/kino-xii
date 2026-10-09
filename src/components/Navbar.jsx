import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, User, Ticket, LogOut, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import SearchBox from './SearchBox'

function Logo({ small }) {
  return (
    <Link to="/" className={`flex gap-1.5 font-extrabold ${small ? 'text-sm' : 'text-xl leading-[22px]'}`}>
      <span>KINO</span>
      <span className="text-accent">XII</span>
    </Link>
  )
}

function ProfileMenu({ user, onClose }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const go = (to) => () => { onClose(); navigate(to) }
  const signOut = async () => { onClose(); await logout(); navigate('/') }

  const item = 'flex w-full items-center gap-2 rounded-[10px] py-2.5 pl-5 text-left text-sm font-semibold hover:bg-white/5'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-bg/20" onMouseDown={onClose} />
      <div className="absolute top-[76px] right-[60px] z-50 w-[302px] rounded-2xl bg-bg pb-2.5">
        {/* identity */}
        <div className="flex items-center gap-2.5 px-5 pt-5">
          <Avatar user={user} size={42} />
          <div className="min-w-0">
            <p className="truncate text-sm leading-[15px] font-semibold">{user.fullName || user.username}</p>
            <p className="truncate text-xs leading-[1.3] text-muted">{user.email}</p>
          </div>
        </div>

        {/* profile status */}
        <div className="mt-4 px-5">
          {user.profileComplete ? (
            <div className="flex items-center gap-1.5 rounded-[10px] bg-success/10 px-3 py-2.5">
              <span className="text-sm leading-[15px] font-semibold text-success">Profile complete</span>
              <Check size={16} className="text-success" />
            </div>
          ) : (
            <div className="rounded-[10px] bg-warning/10 px-3 py-2.5">
              <p className="text-sm leading-[15px] font-semibold text-warning">Profile incomplete</p>
              <p className="mt-0.5 text-xs leading-[1.3] text-muted">
                Add your name, mobile number and date of birth to book tickets.
              </p>
            </div>
          )}
        </div>

        {/* menu */}
        <div className="mt-1 flex flex-col gap-0.5 pt-1">
          <button onClick={go('/profile')} className={item}><User size={16} />My Profile</button>
          <button onClick={go('/profile?tab=tickets')} className={item}><Ticket size={16} />My Tickets</button>
          <div className="h-px bg-white/10" />
          <button onClick={signOut} className={`${item} text-accent`}><LogOut size={16} />Logout</button>
        </div>
      </div>
    </>
  )
}

export default function Navbar() {
  const { user, loading, openModal } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="absolute inset-x-0 top-0 z-30 h-[111px] bg-[linear-gradient(180deg,#000_-212.35%,rgba(0,0,0,0.51)_32.09%,transparent_93.93%)]">
      <nav className="flex items-center justify-between px-[60px] pt-[30px]">
        <div className="flex items-center gap-9">
          <Logo />
          <Link to="/sessions" className="text-xs leading-[13px] font-semibold tracking-[0.06em] uppercase">
            Sessions
          </Link>
        </div>

        <div className="flex items-center gap-8">
          <SearchBox />

          {loading ? (
            <div className="h-10 w-[121px]" /> // reserve space, avoids guest-button flash
          ) : user ? (
            <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-6" aria-expanded={open}>
              <span className="flex items-center gap-3">
                <Avatar user={user} />
                <span className="text-sm leading-[15px] font-semibold">
                  {(user.fullName || user.username).split(' ')[0]}
                </span>
              </span>
              <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => openModal('register')}
                className="h-[41px] rounded-full bg-accent px-[22px] text-sm font-extrabold hover:brightness-110"
              >
                Sign up
              </button>
              <button
                onClick={() => openModal('login')}
                className="h-[41px] rounded-full bg-white px-[22px] text-sm font-extrabold text-bg hover:bg-white/90"
              >
                Log in
              </button>
            </div>
          )}
        </div>
      </nav>

      {open && user && <ProfileMenu user={user} onClose={() => setOpen(false)} />}
    </header>
  )
}