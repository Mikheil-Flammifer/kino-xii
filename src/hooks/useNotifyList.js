import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const keyFor = (userId) => `kino_notify_${userId}`;

function read(userId) {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(keyFor(userId))) ?? [];
  } catch {
    return [];
  }
}

export function useNotifyList() {
  const { user, requireAuth } = useAuth();
  const userId = user?.id;
  const [ids, setIds] = useState(() => read(userId));

  // Re-read when the user changes (login / logout / switch account)
  const [lastUser, setLastUser] = useState(userId);
  if (lastUser !== userId) {
    setLastUser(userId);
    setIds(read(userId));
  }

  const has = (movieId) => ids.includes(movieId);

  // Guests get the login modal; after login the action replays
  const toggle = useCallback(
    (movieId) =>
      requireAuth(() => {
        const uid = userId ?? null;
        // After a fresh login `userId` may still be stale here, so read the key lazily
        const current = uid ? read(uid) : [];
        const next = current.includes(movieId)
          ? current.filter((id) => id !== movieId)
          : [...current, movieId];
        if (uid) {
          try {
            localStorage.setItem(keyFor(uid), JSON.stringify(next));
          } catch {
            /* storage blocked: ignore */
          }
        }
        setIds(next);
      }),
    [requireAuth, userId]
  );

  return { has, toggle };
}