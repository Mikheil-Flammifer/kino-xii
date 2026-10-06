import { useCallback, useEffect, useState } from 'react';

export function useAsync(fn) {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const load = useCallback(() => {
    setStatus('loading');
    fn()
      .then((res) => {
        setData(res);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [fn]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, status, reload: load };
}