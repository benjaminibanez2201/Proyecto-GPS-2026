import { useEffect, useState } from 'react';
import useNotificaciones from '@hooks/notificaciones/useNotificaciones.jsx';
import '@styles/notificaciones.css';

export default function Notificaciones() {
  const { notificaciones, loading, error, unreadCount, loadNotificaciones, loadUnreadCount, markAsRead, markAllRead, removeNotification } = useNotificaciones();
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadNotificaciones({ limit, offset: page * limit });
    loadUnreadCount();
  }, [loadNotificaciones, loadUnreadCount, page]);

  if (loading) return <div className="noti-container">Cargando notificaciones...</div>;
  if (error) return <div className="noti-container">Error: {error}</div>;

  return (
    <div className="noti-container">
      <div className="noti-card">
        <header className="noti-header">
          <h2>Centro de Notificaciones</h2>
          <div className="noti-actions">
            <span className="noti-count">No leídas: {unreadCount}</span>
            <button onClick={() => markAllRead()} className="btn btn-primary">Marcar todas como leídas</button>
          </div>
        </header>

        <ul className="noti-list">
          {notificaciones.length === 0 && <li className="noti-empty">No hay notificaciones</li>}
          {notificaciones.map((n) => (
            <li key={n.id} className={`noti-item ${n.leida ? 'leida' : 'no-leida'}`}>
              <div className="noti-main">
                <div className="noti-mensaje">{n.mensaje}</div>
                <div className="noti-meta">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div className="noti-actions">
                {!n.leida && <button onClick={() => markAsRead(n.id)} className="btn btn-primary">Marcar leída</button>}
                <button onClick={() => removeNotification(n.id)} className="btn btn-danger">Eliminar</button>
              </div>
            </li>
          ))}
        </ul>

        <footer className="noti-footer">
          <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="btn">Anterior</button>
          <button disabled={notificaciones.length < limit} onClick={() => setPage((p) => p + 1)} className="btn">Siguiente</button>
        </footer>
      </div>
    </div>
  );
}
