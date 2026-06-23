import { useState, useCallback, useEffect } from 'react';
import { getPublicaciones } from '@services/publicacion.service.js';

export function usePublicaciones() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarPublicaciones = useCallback(async (filtros = {}) => {
    setCargando(true);
    setError(null);

    const [data, errorRespuesta] = await getPublicaciones(filtros);

    if (errorRespuesta) {
      setError(errorRespuesta);
      setPublicaciones([]);
    } else {
      const listaArriendos = data?.data || (Array.isArray(data) ? data : []);
      
      setPublicaciones(listaArriendos);
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
    cargarPublicaciones
  };
}