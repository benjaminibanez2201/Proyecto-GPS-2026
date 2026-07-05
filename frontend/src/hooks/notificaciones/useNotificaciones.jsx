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
  const [paginacion, setPaginacion] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    paginaActual: 1,
    totalPaginas: 0,
  });
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
        setPaginacion((prev) => ({ ...prev, total: 0, offset: options.offset ?? 0, totalPaginas: 0 }));
      } else {
        const nextNotificaciones = Array.isArray(data) ? data : data?.notificaciones ?? [];
        const nextPagination = data?.paginacion;

        setNotificaciones(nextNotificaciones);
        setPaginacion({
          total: Number(nextPagination?.total ?? nextNotificaciones.length),
          limit: Number(nextPagination?.limit ?? options.limit ?? 20),
          offset: Number(nextPagination?.offset ?? options.offset ?? 0),
          paginaActual: Number(nextPagination?.paginaActual ?? Math.floor((options.offset ?? 0) / (options.limit ?? 20)) + 1),
          totalPaginas: Number(nextPagination?.totalPaginas ?? (nextNotificaciones.length > 0 ? 1 : 0)),
        });
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
    paginacion,
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
