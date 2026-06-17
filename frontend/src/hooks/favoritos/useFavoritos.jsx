import { useState, useCallback, useEffect } from 'react';
import { 
  obtenerMisFavoritos, 
  agregarFavorito, 
  eliminarFavorito 
} from '@services/favoritos.service.js';

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarFavoritos = useCallback(async () => {
    setCargando(true);
    setError(null);
    const [data, errorRespuesta] = await obtenerMisFavoritos();

    if (errorRespuesta) {
      setError(errorRespuesta);
      setFavoritos([]);
    } else {
      setFavoritos(data || []);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarFavoritos();
  }, [cargarFavoritos]);

  const handleAgregarFavorito = async (publicacionId) => {
    setCargando(true);
    setError(null);
    const [data, errorRespuesta] = await agregarFavorito(publicacionId);

    if (errorRespuesta) {
      setError(errorRespuesta);
    } else {
      await cargarFavoritos();
    }
    setCargando(false);
    return errorRespuesta === null; 
  };

  const handleEliminarFavorito = async (publicacionId) => {
    setCargando(true);
    setError(null);
    const [data, errorRespuesta] = await eliminarFavorito(publicacionId);

    if (errorRespuesta) {
      setError(errorRespuesta);
    } else {
      await cargarFavoritos();
    }
    setCargando(false);
    return errorRespuesta === null;
  };

  return {
    favoritos,
    cargando,
    error,
    cargarFavoritos,
    handleAgregarFavorito,
    handleEliminarFavorito
  };
}