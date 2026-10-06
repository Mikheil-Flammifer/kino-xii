export default function CardSkeleton({ className = 'h-[452px]' }) {
  return <div className={`animate-pulse rounded-[20px] bg-surface ${className}`} />;
}