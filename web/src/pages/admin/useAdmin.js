import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/** 401 gelirse giriş sayfasına yönlendiren hata yakalayıcı */
export function useAdminGuard() {
  const nav = useNavigate();
  return useCallback(
    (setError) => (e) => {
      if (e.status === 401) nav('/admin/giris');
      else setError?.(e);
    },
    [nav],
  );
}

export function toLocalInput(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDate(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}
