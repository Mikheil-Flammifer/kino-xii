export const initialsOf = (u) => {
  const src = (u?.fullName || u?.username || '?').trim().split(/\s+/)
  return (src.length > 1 ? src[0][0] + src[1][0] : src[0].slice(0, 2)).toUpperCase()
}

export default function Avatar({ user, size = 40 }) {
  const dot = user.profileComplete ? 'bg-success' : 'bg-warning'
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex shrink-0 items-center justify-center rounded-lg bg-surface"
    >
      {user.avatar ? (
        <img src={user.avatar} alt="" className="size-full rounded-lg object-cover" />
      ) : (
        <span className="text-xs leading-[13px] font-semibold">{initialsOf(user)}</span>
      )}
      <span className={`absolute right-0 bottom-0 size-2 rounded-full border border-bg ${dot}`} />
    </div>
  )
}