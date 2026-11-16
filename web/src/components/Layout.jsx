import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export function Keyhole({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#ff4f3b" />
      <circle cx="32" cy="25" r="10" fill="#0e0d0b" />
      <path d="M26 31h12l4 20H22z" fill="#0e0d0b" />
    </svg>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  const admin = pathname.startsWith('/admin');
  return (
    <>
      <header className="site-head">
        <div className="wrap">
          <Link to="/" className="brand" aria-label="kimvarorda.ai ana sayfa">
            <Keyhole />
            <span>
              kimvarorda<span className="ai">.ai</span>
            </span>
          </Link>
          <nav className="site-nav">
            {admin ? (
              <NavLink to="/admin" end>Vakalar</NavLink>
            ) : (
              <>
                <NavLink to="/" end className="hide-sm">Vakalar</NavLink>
                <NavLink to="/nasil-oynanir">Nasıl oynanır?</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-foot">
        <div className="wrap">
          <span>© {new Date().getFullYear()} kimvarorda.ai — Kim? Nerede? Neyle?</span>
          <span>Tüm vakalar ve karakterler kurgudur.</span>
        </div>
      </footer>
    </>
  );
}
