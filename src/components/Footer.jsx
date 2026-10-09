export default function Footer() {
  return (
    <footer className="bg-bg px-[34px] pt-[27px] pb-[34px] h-[98px]">
      <div className="flex flex-col gap-5">
        <div className="h-px w-full bg-line" />
        <div className="flex items-center gap-[10px]">
          <div className="flex gap-1 text-[14px] leading-[15px] font-extrabold">
            <span>KINO</span>
            <span className="text-accent">XII</span>
          </div>
          <p className="ml-auto text-[12px] leading-[130%] text-muted">
            © 2026 Kino XII. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}