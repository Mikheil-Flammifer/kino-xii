import { useState } from 'react'
import Modal from '../components/Modal'
import Input from '../components/Input'
import { useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const rules = {
  email: (v) => (!EMAIL_RE.test(v) ? 'Enter a valid email' : ''),
  password: (v) => (v.length < 3 ? 'Minimum 3 characters' : ''),
}

export default function LoginModal() {
  const { closeModal, openModal, login } = useAuth()

  const [values, setValues] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const clientError = (name) => rules[name](values[name])
  const errorFor = (name) =>
    serverErrors[name] || (touched[name] ? clientError(name) : '')
  const isValid = (name) => values[name] && !clientError(name) && !serverErrors[name]
  const allValid = Object.keys(rules).every((n) => !clientError(n))

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }))
    setServerErrors({}) // any edit clears the API error
  }
  const field = (name) => ({
    value: values[name],
    onChange: set(name),
    onBlur: () => setTouched((t) => ({ ...t, [name]: true })),
    error: errorFor(name),
    valid: isValid(name),
  })

  async function onSubmit(e) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!allValid) return

    setSubmitting(true)
    try {
      await login(values.email, values.password)
      // AuthContext closes the modal and replays the pending action
    } catch (err) {
      if (err.errors) {
        // 422: map each key onto its input
        const mapped = {}
        for (const [key, msgs] of Object.entries(err.errors)) mapped[key] = msgs[0]
        setServerErrors(mapped)
      } else if (err.status === 401) {
        // wrong credentials: message under password, email stays filled
        setServerErrors({ password: err.message })
      } else {
        setServerErrors({ password: err.message || 'Something went wrong. Try again.' })
      }
      // password is cleared, email keeps its value
      setValues((v) => ({ ...v, password: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Log in" subtitle="Welcome back to Kino XII" onClose={closeModal}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <Input
            label="Email"
            type="email"
            placeholder="e.g. jane@example.com"
            autoComplete="email"
            autoFocus
            {...field('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••"
            autoComplete="current-password"
            {...field('password')}
          />
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            type="submit"
            disabled={!allValid || submitting}
            className="h-[41px] w-full rounded-full bg-accent text-sm font-extrabold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-muted disabled:hover:brightness-100"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
          <p className="flex gap-[5px] text-sm text-muted">
            Don't have an account?
            <button type="button" onClick={() => openModal('register')} className="font-extrabold text-accent">
              Sign up
            </button>
          </p>
        </div>
      </form>
    </Modal>
  )
}