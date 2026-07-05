import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import '@styles/error404.css';

const Error404 = () => {
  return (
    <main className="error404">
      <div className="error404-blob error404-blob--one" />
      <div className="error404-blob error404-blob--two" />

      <div className="error404-card">
        <div className="error404-icon">
          <Compass size={30} strokeWidth={2} />
        </div>

        <p className="error404-eyebrow">Error 404</p>
        <h1 className="error404-code">4<span>0</span>4</h1>
        <h2 className="error404-title">Esta página se perdió en el camino</h2>
        <p className="error404-subtitle">
          Puede que el enlace esté roto o que la página se haya movido de lugar.
        </p>

        <Link to="/home" className="error404-button">
          <Home size={18} strokeWidth={2.2} />
          Volver al inicio
        </Link>
      </div>
    </main>
  );
};

export default Error404;
