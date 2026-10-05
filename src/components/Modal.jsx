import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ title, subtitle, onClose, width = 475, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#242424]/30 backdrop-blur-[5px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ width }}
        className="flex max-w-[95vw] max-h-[95vh] flex-col gap-6 overflow-y-auto rounded-[28px] border border-line bg-bg p-8 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)]"
      >
        <div className="flex items-start justify-between gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl leading-[22px] font-extrabold">{title}</h2>
            <p className="text-xs leading-[1.3] text-muted">{subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-white hover:text-muted">
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}