import { Check, CircleAlert } from 'lucide-react'

export default function Input({ label, error, valid, ...props }) {
  return (
    <label className="flex w-full flex-col gap-2.5">
      <span className={`text-xs leading-[13px] font-semibold ${error ? 'text-accent' : 'text-white'}`}>
        {label}
      </span>
      <div
        className={`flex h-10 items-center justify-between gap-2 rounded-xl bg-surface px-4 border ${
          error ? 'border-accent' : 'border-transparent focus-within:border-line'
        }`}
      >
        <input
          {...props}
          aria-invalid={!!error}
          className="w-full bg-transparent text-xs font-semibold text-white outline-none placeholder:text-muted"
        />
        {error && <CircleAlert size={16} className="shrink-0 text-accent" />}
        {!error && valid && <Check size={16} className="shrink-0 text-success" />}
      </div>
      {error && <span className="-mt-1 text-xs leading-[13px] font-semibold text-accent">{error}</span>}
    </label>
  )
}