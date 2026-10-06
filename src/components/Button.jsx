const variants = {
  primary: 'bg-accent text-white hover:brightness-110',
  glass: 'bg-white/10 text-white hover:bg-white/20',
  outline: 'border border-muted text-white hover:bg-white/10',
  light: 'bg-white text-bg hover:bg-white/90',
};
const sizes = {
  sm: 'px-3 py-[6px] text-[12px] leading-[13px] font-semibold',
  md: 'px-[22px] py-[10px] text-[14px] leading-[15px] font-extrabold',
  lg: 'px-[22px] py-[13px] text-[14px] leading-[15px] font-extrabold',
};

export default function Button({
  variant = 'primary', size = 'md', icon: Icon, className = '', children, ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1 rounded-full transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}