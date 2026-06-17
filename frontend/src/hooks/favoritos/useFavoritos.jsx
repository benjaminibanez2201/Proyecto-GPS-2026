import { useState, useCallback, useEffect } from 'react';
import {
  getMisFavoritos,
  agregarFavorito,
  eliminarFavorito,
} from '@services/user.service.js';

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarFavoritos = useCallback(async () => {
    setCargando(true);
    setError(null);

    const data = await getMisFavoritos();

    if (Array.isArray(data)) {
      setFavoritos(data);
    } else {
      setError(data?.message || 'Error al cargar tus favoritos');
      setFavoritos([]);
    }

    setCargando(false);
  }, []);

  useEffect(() => {
    cargarFavoritos();
  }, [cargarFavoritos]);

  const handleAgregarFavorito = async (publicacionId) => {
    setCargando(true);
    setError(null);

    const response = await agregarFavorito(publicacionId);

    if (response?.status === 'Client error' || response?.message?.toLowerCase?.()?.includes('error')) {
      setError(response?.details || response?.message || 'Error al guardar favorito');
    } else {
      await cargarFavoritos();
    }

    setCargando(false);
    return !(response?.status === 'Client error' || response?.message?.toLowerCase?.()?.includes('error'));
  };

  const handleEliminarFavorito = async (publicacionId) => {
    setCargando(true);
    setError(null);

    const response = await eliminarFavorito(publicacionId);

    if (response?.status === 'Client error' || response?.message?.toLowerCase?.()?.includes('error')) {
      setError(response?.details || response?.message || 'Error al eliminar favorito');
    } else {
      await cargarFavoritos();
    }

    setCargando(false);
    return !(response?.status === 'Client error' || response?.message?.toLowerCase?.()?.includes('error'));
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