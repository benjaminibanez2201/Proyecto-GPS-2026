import { useState } from 'react';
import { updateUser, updateUserVerificationStatus } from '@services/user.service.js';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';
import { formatPostUpdate } from '@helpers/formatData.js';

const normalize = (value) => (value ?? '').toString().trim();
const normalizeLower = (value) => normalize(value).toLowerCase();

const useEditUser = (setUsers) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [dataUser, setDataUser] = useState([]);

    const handleClickUpdate = () => {
        if (dataUser.length === 0) {
            return;
        }

        if (dataUser.length > 1) {
            showErrorAlert('Selección inválida', 'Solo puedes editar un usuario a la vez.');
            return;
        }

        setIsPopupOpen(true);
    };

    const handleUpdate = async (updatedUserData) => {
        if (updatedUserData) {
            try {
            const originalUser = dataUser[0];
            const { estadoVerificacion, ...editableUserData } = updatedUserData;
            const requestedStatus = normalizeLower(estadoVerificacion || originalUser.estadoVerificacion || 'pendiente');
            const currentStatus = normalizeLower(originalUser.estadoVerificacion || 'pendiente');
            const hasEditableChanges = (
                normalize(editableUserData.nombreCompleto) !== normalize(originalUser.nombreCompleto) ||
                normalizeLower(editableUserData.email) !== normalizeLower(originalUser.email) ||
                normalizeLower(editableUserData.rut) !== normalizeLower(originalUser.rut) ||
                normalizeLower(editableUserData.rol) !== normalizeLower(originalUser.rol) ||
                normalize(editableUserData.newPassword) !== ''
            );

            let updatedUser = originalUser;

            if (hasEditableChanges) {
                updatedUser = await updateUser(editableUserData, originalUser.rut);

                if (!updatedUser?.id) {
                    throw new Error(updatedUser?.message || 'No se pudo actualizar el usuario');
                }
            }

            if (requestedStatus && requestedStatus !== currentStatus) {
                updatedUser = await updateUserVerificationStatus(
                    updatedUser?.id ? updatedUser : (editableUserData.rut || originalUser.rut),
                    requestedStatus,
                );

                if (!updatedUser?.id) {
                    throw new Error(updatedUser?.message || 'No se pudo actualizar el estado');
                }
            }
            showSuccessAlert('¡Actualizado!','El usuario ha sido actualizado correctamente.');
            setIsPopupOpen(false);
            const formattedUser = formatPostUpdate(updatedUser);

            setUsers(prevUsers => prevUsers.map(user => {
                return user.id === formattedUser.id ? formattedUser : user;
            }));


            setDataUser([]);
            } catch (error) {
                console.error('Error al actualizar el usuario:', error);
                showErrorAlert('Cancelado','Ocurrió un error al actualizar el usuario.');
            }
        }
    };

    return {
        handleClickUpdate,
        handleUpdate,
        isPopupOpen,
        setIsPopupOpen,
        dataUser,
        setDataUser
    };
};

export default useEditUser;
