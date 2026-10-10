import { useAuth } from '../context/AuthContext';
import SectionHeader from '../components/SectionHeader';
import Hero from '../components/Hero';
import CardSmall from '../components/CardSmall';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { getNowPlaying } from '../api/movies';
import { useAsync } from '../hooks/useAsync';
import CardBig from '../components/CardBig';
import CardSkeleton from '../components/CardSkeleton';
import Button from '../components/Button';
import { getComingSoon } from '../api/movies';
import CardMedium from '../components/CardMedium';
import { useNotifyList } from '../hooks/useNotifyList';


export default function Home() {
  const { user } = useAuth();
  const { recent } = useRecentlyViewed();
  const nowPlaying = useAsync(getNowPlaying);
  const comingSoon = useAsync(getComingSoon);
  const notify = useNotifyList();
  // later: const recent = useRecentlyViewed();

  return (
    <>
      <Hero />

      <div className="flex flex-col gap-10 pt-8 ">
       {user && recent.length > 0 && (
          <>
            <section className="px-[70px] pt-[9px]">
              <h2 className="mb-5 text-[24px] leading-[26px] font-extrabold">Recently viewed</h2>
              <div className="grid grid-cols-4 gap-5">
                {recent.map((m) => (
                  <CardSmall key={m.slug} movie={m} />
                ))}
              </div>
            </section>
            <div className="h-px bg-line" />
          </>
        )}

        <section className="flex flex-col gap-6 px-[70px]">
          <SectionHeader title="Now playing" to="/sessions" />

          {nowPlaying.status === 'loading' && (
            <div className="grid grid-cols-6 gap-[17px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {nowPlaying.status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-muted">Couldn't load films.</p>
              <Button onClick={nowPlaying.reload}>Retry</Button>
            </div>
          )}

          {nowPlaying.status === 'ready' && nowPlaying.data.length === 0 && (
            <p className="py-10 text-center text-muted">No films are playing right now.</p>
          )}

          {nowPlaying.status === 'ready' && nowPlaying.data.length > 0 && (
            <div className="grid grid-cols-6 gap-[17px]">
              {nowPlaying.data.slice(0, 6).map((m) => (
                <CardBig key={m.id} movie={m} />
              ))}
            </div>
          )}
        </section>

        <div className="h-px bg-line" />

          <section className="flex flex-col gap-6 px-[70px] h-[229.66px]">
            <SectionHeader title="Coming soon..." />

            {comingSoon.status === 'loading' && (
              <div className="grid grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CardSkeleton key={i} className="h-[160px]" />
                ))}
              </div>
            )}

            {comingSoon.status === 'error' && (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-muted">Couldn't load upcoming films.</p>
                <Button onClick={comingSoon.reload}>Retry</Button>
              </div>
            )}

            {comingSoon.status === 'ready' && comingSoon.data.length === 0 && (
              <p className="py-10 text-center text-muted">No upcoming films yet.</p>
            )}

            {comingSoon.status === 'ready' && comingSoon.data.length > 0 && (
              <div className="grid grid-cols-3 gap-5">
                {comingSoon.data.slice(0, 3).map((m) => (
                  <CardMedium
                    key={m.id}
                    movie={m}
                    notified={notify.has(m.id)}
                    onNotify={notify.toggle}
                  />
                ))}
              </div>
            )}
          </section>
      </div>
    </>
  );
}