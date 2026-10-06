import { Link } from 'react-router-dom';

export default function SectionHeader({ title, to }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <h2 className="text-[24px] leading-[26px] font-extrabold uppercase">{title}</h2>
      {to && (
        <Link to={to} className="text-[14px] leading-[15px] font-semibold text-accent hover:underline">
          See all
        </Link>
      )}
    </div>
  );
}