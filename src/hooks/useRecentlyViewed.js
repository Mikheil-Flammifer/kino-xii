import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MAX_ITEMS = 4;
const keyFor = (userId) => `kino_recent_${userId}`;

function read(userId) {
  if (!userId) return [];
  try {
    const list = JSON.parse(localStorage.getItem(keyFor(userId)));
    // old entries saved before `slug` existed would link to /movies/undefined
    return Array.isArray(list) ? list.filter((m) => m?.slug) : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const { user } = useAuth();
  const userId = user?.id;
  const [recent, setRecent] = useState(() => read(userId));

  // Re-read when the user changes (login / logout / switch account)
  const [lastUser, setLastUser] = useState(userId);
  if (lastUser !== userId) {
    setLastUser(userId);
    setRecent(read(userId));
  }

  // Call this from the Movie detail page
  const add = useCallback(
    (movie) => {
      if (!userId || !movie?.slug) return;
      const item = {
        id: movie.id,
        slug: movie.slug,
        title: movie.title,
        poster: movie.poster,
        backdrop: movie.backdrop,
        genres: movie.genres,
        duration: movie.duration,
      };
      const next = [item, ...read(userId).filter((m) => m.slug !== movie.slug)].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(keyFor(userId), JSON.stringify(next));
      } catch {
        /* storage full or blocked: ignore */
      }
      setRecent(next);
    },
    [userId]
  );

  return { recent, add };
}