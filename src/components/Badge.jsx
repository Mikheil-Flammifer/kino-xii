const variants = {
  accent: 'bg-accent/10 text-accent',
  glass: 'bg-white/10 text-white',
};

export default function Badge({ variant = 'accent', icon: Icon, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-[10px] py-[4px] text-[12px] leading-[13px] font-semibold ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </span>
  );
}