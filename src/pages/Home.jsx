import { useAuth } from '../context/AuthContext';
import SectionHeader from '../components/SectionHeader';
import Hero from '../components/Hero';
import CardSmall from '../components/CardSmall';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import Footer from '../components/Footer';

export default function Home() {
  const { user } = useAuth();
  const { recent } = useRecentlyViewed();
  // later: const recent = useRecentlyViewed();

  return (
    <>
      <Hero />

      <div className="flex flex-col gap-10 pt-8">
       {user && recent.length > 0 && (
          <>
            <section className="px-[70px] pt-[9px]">
              <h2 className="mb-5 text-[24px] leading-[26px] font-extrabold">Recently viewed</h2>
              <div className="grid grid-cols-4 gap-5">
                {recent.map((m) => (
                  <CardSmall key={m.id} movie={m} />
                ))}
              </div>
            </section>
            <div className="h-px bg-line" />
          </>
        )}

        <section className="flex flex-col gap-6 px-[70px]">
          <SectionHeader title="Now playing" to="/sessions" />
          <div className="grid grid-cols-6 gap-[17px]">{/* step 4: CardBig */}</div>
        </section>

        <div className="h-px bg-line" />

        <section className="flex flex-col gap-6 px-[70px]">
          <SectionHeader title="Coming soon..." />
          <div className="grid grid-cols-3 gap-5">{/* step 5: CardMedium */}</div>
        </section>
      </div>

      <Footer />
    </>
  );
}