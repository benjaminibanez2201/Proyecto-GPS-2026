import { useState } from 'react';
import '@styles/avatarCirculo.css';

export default function AvatarCirculo({ nombre, foto, size = 40, shape = 'circle' }) {
  const [errorImagen, setErrorImagen] = useState(false);
  const borderRadius = shape === 'square' ? Math.round(size * 0.32) : '50%';

  return (
    <div
      className="avatar-circulo"
      style={{ width: size, height: size, borderRadius, fontSize: Math.round(size * 0.4) }}
    >
      {foto && !errorImagen ? (
        <img
          src={foto}
          alt={nombre || 'Usuario'}
          className="avatar-circulo-img"
          onError={() => setErrorImagen(true)}
        />
      ) : (
        (nombre || '—').charAt(0).toUpperCase()
      )}
    </div>
  );
}
