import { useState } from 'react';
import { resolveFileUrl } from '@helpers/resolveFileUrl.js';
import '@styles/avatarCirculo.css';

export default function AvatarCirculo({ nombre, foto, size = 40, shape = 'circle' }) {
  const [errorImagen, setErrorImagen] = useState(false);
  const borderRadius = shape === 'square' ? Math.round(size * 0.32) : '50%';
  const fotoResuelta = resolveFileUrl(foto);

  return (
    <div
      className="avatar-circulo"
      style={{ width: size, height: size, borderRadius, fontSize: Math.round(size * 0.4) }}
    >
      {fotoResuelta && !errorImagen ? (
        <img
          src={fotoResuelta}
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
