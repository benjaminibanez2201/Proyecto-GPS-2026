import { useState } from 'react';
import Swal from 'sweetalert2';
import { toggleUserStatusRequest } from '@services/user.service.js';

const useToggleStatus = (fetchUsers, setDataUser) => {
  const [procesandoEstado, setProcesandoEstado] = useState(false);

  const handleToggleStatus = async (usuariosSeleccionados) => {
    if (!usuariosSeleccionados || usuariosSeleccionados.length === 0) return;

    const usuario = usuariosSeleccionados[0];
    const estaSuspendido = usuario.estadoCuenta === 'suspendido';
    const nuevoEstado = estaSuspendido ? 'activo' : 'suspendido';
    const accionTexto = estaSuspendido ? 'reactivar' : 'suspender';
    const accionPasado = estaSuspendido ? 'reactivada' : 'suspendida';

    const confirmacion = await Swal.fire({
      title: `¿Estás seguro de ${accionTexto} esta cuenta?`,
      text: `La cuenta de ${usuario.nombreCompleto} pasará a estado ${nuevoEstado}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accionTexto}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: estaSuspendido ? '#10b981' : '#f59e0b',
      cancelButtonColor: '#64748b',
    });

    if (!confirmacion.isConfirmed) return;

    setProcesandoEstado(true);
    try {
      const response = await toggleUserStatusRequest(usuario.id, nuevoEstado);

      if (response?.status === 'Success') {
        if (fetchUsers) fetchUsers();
        if (setDataUser) setDataUser([]);
        await Swal.fire({
          icon: 'success',
          title: `Cuenta ${accionPasado}`,
          text: `La cuenta de ${usuario.nombreCompleto} ha sido ${accionPasado} correctamente.`,
          confirmButtonColor: '#0f766e',
        });
      } else {
        const detalle = response?.details || response?.message || 'Ocurrió un error al modificar el estado de la cuenta.';
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo cambiar el acceso',
          text: detalle,
          confirmButtonColor: '#0f766e',
        });
      }
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error inesperado',
        text: 'Ocurrió un error inesperado al procesar la solicitud.',
        confirmButtonColor: '#0f766e',
      });
    } finally {
      setProcesandoEstado(false);
    }
  };

  return { handleToggleStatus, procesandoEstado };
};

export default useToggleStatus;