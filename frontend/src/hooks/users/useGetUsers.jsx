import { useCallback, useEffect, useState } from 'react';
import { getUsers } from '@services/user.service.js';

const useUsers = () => {
    const [users, setUsers] = useState([]);

    const dataLogged = useCallback((formattedData) => {
        try {
            const { rut } = JSON.parse(sessionStorage.getItem('usuario'));
            for(let i = 0; i < formattedData.length ; i++) {
                if(formattedData[i].rut === rut) {
                    formattedData.splice(i, 1);
                    break;
                }
            }
        } catch (error) {
            console.error("Error: ", error)
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await getUsers();
            const formattedData = Array.isArray(response) ? [...response] : [];
            dataLogged(formattedData);
            setUsers(formattedData);
        } catch (error) {
            console.error("Error: ", error);
        }
    }, [dataLogged]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, fetchUsers, setUsers };
};

export default useUsers;
