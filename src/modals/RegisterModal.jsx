import { useEffect, useMemo, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import Modal from '../components/Modal'
import Input from '../components/Input'
import { useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR = 2 * 1024 * 1024

const rules = {
  username: (v) => (v.trim().length < 3 ? 'Minimum 3 characters' : ''),
  email: (v) => (!EMAIL_RE.test(v) ? 'Enter a valid email' : ''),
  password: (v) => (v.length < 3 ? 'Minimum 3 characters' : ''),
  confirm: (v, all) => (v !== all.password || !v ? 'Passwords do not match' : ''),
}

// API error keys → our field names
const SERVER_KEY = { password_confirmation: 'confirm' }

export default function RegisterModal() {
  const { closeModal, openModal, register } = useAuth()

  const [values, setValues] = useState({ username: '', email: '', password: '', confirm: '' })
  const [touched, setTouched] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [avatar, setAvatar] = useState(null)
  const [avatarError, setAvatarError] = useState('')
  const preview = useMemo(() => (avatar ? URL.createObjectURL(avatar) : null), [avatar])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const clientError = (name) => rules[name](values[name], values)
  const errorFor = (name) =>
    serverErrors[name] || (touched[name] ? clientError(name) : '')
  const isValid = (name) => values[name] && !clientError(name) && !serverErrors[name]

  const allValid = Object.keys(rules).every((n) => !clientError(n)) && !avatarError

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    setServerErrors((s) => ({ ...s, [name]: undefined })) // clear API error on edit
    setFormError('')
  }
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }))
  const field = (name) => ({
    value: values[name],
    onChange: set(name),
    onBlur: blur(name),
    error: errorFor(name),
    valid: isValid(name),
  })

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!IMG_TYPES.includes(file.type)) {
      setAvatar(null)
      return setAvatarError('Only JPG, PNG or WEBP images are allowed')
    }
    if (file.size > MAX_AVATAR) {
      setAvatar(null)
      return setAvatarError('Image must be 2MB or smaller')
    }
    setAvatarError('')
    setAvatar(file)
  }

  async function onSubmit(e) {
    e.preventDefault()
    setTouched({ username: true, email: true, password: true, confirm: true })
    if (!allValid) return

    setSubmitting(true)
    setFormError('')
    try {
      await register({ ...values, avatar })
      // AuthContext closes the modal and replays the pending action
    } catch (err) {
      if (err.errors) {
        const mapped = {}
        for (const [key, msgs] of Object.entries(err.errors)) {
          const name = SERVER_KEY[key] ?? key
          if (name === 'avatar') setAvatarError(msgs[0])
          else mapped[name] = msgs[0]
        }
        setServerErrors(mapped)
      } else {
        setFormError(err.message) // rule problem or 500
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Sign up" subtitle="Welcome to Kino XII" onClose={closeModal}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
        {/* Avatar */}
        <div className="flex flex-col gap-2">
          <label className="flex w-fit cursor-pointer items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center overflow-hidden rounded-lg ${
                preview ? '' : 'border border-dashed border-line bg-white/10'
              }`}
            >
              {preview ? (
                <img src={preview} alt="Avatar preview" className="size-full object-cover" />
              ) : (
                <ImagePlus size={16} className="text-disabled" />
              )}
            </div>
            <div className="flex flex-col gap-[3px]">
              <span className="text-sm leading-[15px] font-extrabold">Upload avatar (optional)</span>
              <span className="text-xs leading-[1.3] text-muted">JPG, PNG or WEBP</span>
            </div>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onFile} className="sr-only" />
          </label>
          {avatarError && <span className="text-xs font-semibold text-accent">{avatarError}</span>}
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-6">
          <Input label="Username" placeholder="e.g. jane" autoComplete="username" {...field('username')} />
          <Input label="Email" type="email" placeholder="e.g. jane@example.com" autoComplete="email" {...field('email')} />
          <div className="flex items-start gap-3">
            <Input label="Password" type="password" placeholder="••••" autoComplete="new-password" {...field('password')} />
            <Input label="Confirm Password" type="password" placeholder="••••" autoComplete="new-password" {...field('confirm')} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-6">
          {formError && <p className="w-full text-xs font-semibold text-accent">{formError}</p>}
          <button
            type="submit"
            disabled={!allValid || submitting}
            className="h-[41px] w-full rounded-full bg-accent text-sm font-extrabold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-muted disabled:hover:brightness-100"
          >
            {submitting ? 'Signing up…' : 'Sign up'}
          </button>
          <p className="flex gap-[5px] text-sm text-muted">
            Already have an account?
            <button type="button" onClick={() => openModal('login')} className="font-extrabold text-accent">
              Log in
            </button>
          </p>
        </div>
      </form>
    </Modal>
  )
}