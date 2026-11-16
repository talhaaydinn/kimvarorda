import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="wrap narrow center" style={{ paddingTop: 80 }}>
      <div className="kicker">404</div>
      <h1 style={{ marginTop: 12 }}>İz kayboldu.</h1>
      <p className="muted">Aradığın sayfa burada değil.</p>
      <Link to="/" className="btn primary" style={{ marginTop: 12 }}>Ana sayfa</Link>
    </div>
  );
}
