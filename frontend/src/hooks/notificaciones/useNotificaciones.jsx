import { useState, useCallback } from 'react';
import {
  obtenerNotificacionesPorUsuario,
  obtenerCantidadNotificacionesNoLeidas,
  marcarNotificacionComoLeida,
  marcarTodasNotificacionesComoLeidas,
  eliminarNotificacion,
} from '@services/notificacion.service.js';

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotificaciones = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const [data, err] = await obtenerNotificacionesPorUsuario(options);
      if (err) {
        setError(err);
        setNotificaciones([]);
      } else {
        setNotificaciones(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setError(e.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const [count, err] = await obtenerCantidadNotificacionesNoLeidas();
      if (!err) setUnreadCount(typeof count === 'number' ? count : Number(count) || 0);
    } catch {
      // ignore
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    const [res, err] = await marcarNotificacionComoLeida(id);
    if (!err) {
      setNotificaciones((prev) => prev.map((n) => (n.id === Number(id) ? { ...n, leida: true, readAt: res?.readAt ?? new Date() } : n)));
      await loadUnreadCount();
      return [res, null];
    }
    return [null, err];
  }, [loadUnreadCount]);

  const markAllRead = useCallback(async () => {
    const [res, err] = await marcarTodasNotificacionesComoLeidas();
    if (!err) {
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true, readAt: new Date() })));
      await loadUnreadCount();
      return [res, null];
    }
    return [null, err];
  }, [loadUnreadCount]);

  const removeNotification = useCallback(async (id) => {
    const [res, err] = await eliminarNotificacion(id);
    if (!err) {
      setNotificaciones((prev) => prev.filter((n) => n.id !== Number(id)));
      await loadUnreadCount();
      return [res, null];
    }
    return [null, err];
  }, [loadUnreadCount]);

  return {
    notificaciones,
    loading,
    error,
    unreadCount,
    loadNotificaciones,
    loadUnreadCount,
    markAsRead,
    markAllRead,
    removeNotification,
  };
}

export default useNotificaciones;
