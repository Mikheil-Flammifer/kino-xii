export default function Footer() {
  return (
    <footer className="border-t border-line px-[34px] pt-[27px] pb-[34px]">
      <div className="flex items-center gap-[10px]">
        <div className="flex gap-1 text-[14px] leading-[15px] font-extrabold">
          <span>KINO</span>
          <span className="text-accent">XII</span>
        </div>
        <p className="ml-auto text-[12px] leading-[16px] text-muted">
          © 2026 Kino XII. All rights reserved.
        </p>
      </div>
    </footer>
  );
}