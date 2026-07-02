import { useState, useCallback, useEffect } from 'react';
import { getPublicaciones } from '@services/publicacion.service.js';

export function usePublicaciones() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [paginacion, setPaginacion] = useState({
    paginaActual: 1,
    totalPaginas: 1,
    total: 0,
  });

  const cargarPublicaciones = useCallback(async (filtros = {}) => {
    setCargando(true);
    setError(null);

    const [data, errorRespuesta] = await getPublicaciones(filtros);

    if (errorRespuesta) {
      setError({ message: errorRespuesta, ts: Date.now() });
      setPublicaciones([]);
      setPaginacion({ paginaActual: 1, totalPaginas: 1, total: 0 });
    } else {
      const listaArriendos = data?.data || (Array.isArray(data) ? data : []);

      setPublicaciones(listaArriendos);
      setPaginacion({
        paginaActual: data?.paginaActual || 1,
        totalPaginas: data?.totalPaginas || 1,
        total: data?.total || 0,
      });
    }

    setCargando(false);
  }, []);

  useEffect(() => {
    cargarPublicaciones();
  }, [cargarPublicaciones]);

  return {
    publicaciones,
    cargando,
    error,
    paginacion,
    cargarPublicaciones
  };
}