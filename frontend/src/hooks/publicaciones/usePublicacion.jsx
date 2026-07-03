import { useState, useCallback, useEffect } from 'react';
import { getPublicaciones } from '@services/publicacion.service.js';

export function usePublicaciones() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [paginacion, setPaginacion] = useState({
    total: 0,
    paginaActual: 1,
    totalPaginas: 1,
  });

  const cargarPublicaciones = useCallback(async (filtros = {}) => {
    setCargando(true);
    setError(null);

    const [data, errorRespuesta] = await getPublicaciones(filtros);

    if (errorRespuesta) {
      setError({ message: errorRespuesta, ts: Date.now() });
      setPublicaciones([]);
      setPaginacion({
        total: 0,
        paginaActual: 1,
        totalPaginas: 1,
      });
    } else {
      const listaArriendos = data?.data || (Array.isArray(data) ? data : []);
      const total = Number(data?.total ?? listaArriendos.length);
      const paginaActual = Number(data?.paginaActual ?? filtros.pagina ?? 1);
      const totalPaginas = Number(data?.totalPaginas ?? 1);

      setPublicaciones(listaArriendos);
      setPaginacion({
        total,
        paginaActual,
        totalPaginas: Math.max(totalPaginas, 1),
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
