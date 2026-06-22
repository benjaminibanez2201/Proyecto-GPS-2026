"use strict";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { sendCredentialChangedEmail } from "./email.service.js";

//LA OCUPO PARA VER UN PERFIL, REVISAR SUS RESEÑAS Y CALIFICACIÓN.
export async function getUserService(query) {
  try {
    const { rut, id, email } = query;

    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
      select: {
        id: true,
        nombreCompleto: true,
        rut: true,
        email: true,
        rol: true,
        estadoVerificacion: true,
        password: true,
        avgRating: true,
        reviewsCount: true,
        fotoPerfil: true,
      },
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const { password, ...userData } = userFound;

    return [userData, null];
  } catch (error) {
    console.error("Error obtener el usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getUsersService() {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const users = await userRepository.find();

    if (!users || users.length === 0) return [null, "No hay usuarios"];

    const usersData = users.map(({ password, ...user }) => user);

    return [usersData, null];
  } catch (error) {
    console.error("Error al obtener a los usuarios:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateUserService(query, body) {
  try {
    const { id, rut, email } = query;

    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const existingUser = await userRepository.findOne({
      where: [{ rut: body.rut }, { email: body.email }],
    });

    if (existingUser && existingUser.id !== userFound.id) {
      return [null, "Ya existe un usuario con el mismo rut o email"];
    }

    if (body.password) {
      const matchPassword = await comparePassword(
        body.password,
        userFound.password,
      );

      if (!matchPassword) return [null, "La contraseña no coincide"];
    }

    const dataUserUpdate = {
      nombreCompleto: body.nombreCompleto,
      rut: body.rut,
      email: body.email,
      rol: body.rol,
      updatedAt: new Date(),
    };

    if (body.newPassword && body.newPassword.trim() !== "") {
      dataUserUpdate.password = await encryptPassword(body.newPassword);
    }

    await userRepository.update({ id: userFound.id }, dataUserUpdate);

    const userData = await userRepository.findOne({
      where: { id: userFound.id },
    });

    if (!userData) {
      return [null, "Usuario no encontrado después de actualizar"];
    }

    const { password, ...userUpdated } = userData;

    return [userUpdated, null];
  } catch (error) {
    console.error("Error al modificar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function deleteUserService(query) {
  try {
    const { id, rut, email } = query;

    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    if (userFound.rol === "administrador") {
      return [null, "No se puede eliminar un usuario con rol de administrador"];
    }

    const userDeleted = await userRepository.remove(userFound);

    const { password, ...dataUser } = userDeleted;

    return [dataUser, null];
  } catch (error) {
    console.error("Error al eliminar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateProfileService(id, body) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({ 
      where: { id },
      select: ['id', 'nombreCompleto', 'universidad', 'carrera', 'telefono', 'fotoPerfil', 'password']
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const dataToUpdate = {
      ...(body.nombreCompleto && { nombreCompleto: body.nombreCompleto }),
      ...(body.universidad && { universidad: body.universidad }),
      ...(body.carrera && { carrera: body.carrera }),
      ...(body.telefono && { telefono: body.telefono }),
      ...(body.fotoPerfil && { fotoPerfil: body.fotoPerfil }),
      updatedAt: new Date(),
    };

    if (body.newPassword && body.newPassword.trim() !== '') {
      dataToUpdate.password = await encryptPassword(body.newPassword);
    }

    await userRepository.update({ id: userFound.id }, dataToUpdate);

    const userData = await userRepository.findOne({ where: { id: userFound.id } });

    if (!userData) return [null, "Usuario no encontrado después de actualizar"];

    if (body.newPassword) {
      try {
        await sendCredentialChangedEmail(
          { email: userData.email, nombreCompleto: userData.nombreCompleto },
          ['password']
        );
      } catch (emailError) {
        console.error("Error al enviar correo de aviso:", emailError);
      }
    }

    const { password, ...userUpdated } = userData;

    return [userUpdated, null];
  } catch (error) {
    console.error("Error al actualizar el perfil del usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getProfileService(id) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({ where: { id } });

    if (!userFound) return [null, "Usuario no encontrado"];

    const { password, ...userData } = userFound;

    return [userData, null];
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateArrendadorProfileService(id, body) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({ 
      where: { id },
      select: ['id', 'nombreCompleto', 'email', 'telefono', 'fotoPerfil', 'rol', 'estadoVerificacion']
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    if (body.email) {
      const existingEmail = await userRepository.findOne({ where: { email: body.email } });
      if (existingEmail && existingEmail.id !== userFound.id) {
        return [null, "El correo ya está en uso por otro usuario"];
      }
    }

    const dataToUpdate = {
      ...(body.nombreCompleto && { nombreCompleto: body.nombreCompleto }),
      ...(body.email && { email: body.email }),
      ...(body.telefono && { telefono: body.telefono }),
      ...(body.fotoPerfil && { fotoPerfil: body.fotoPerfil }),
      updatedAt: new Date(),
    };

    await userRepository.update({ id: userFound.id }, dataToUpdate);

    const userData = await userRepository.findOne({ where: { id: userFound.id } });

    if (!userData) return [null, "Usuario no encontrado después de actualizar"];

    const { password, ...userUpdated } = userData;

    console.log("body.email:", body.email);
    console.log("userFound.email:", userFound.email);
    if (body.email && body.email !== userFound.email) {
      try {
        console.log("Enviando correo de aviso a:", userFound.email);
        await sendCredentialChangedEmail(
          { email: userFound.email, nombreCompleto: userFound.nombreCompleto },
          ['email'],
          console.log("correo enviado a", userFound.email)
        );
      } catch (emailError) {
        console.error("Error al enviar correo de aviso:", emailError);
      }
    }

    return [userUpdated, null];
  } catch (error) {
    console.error("Error al actualizar perfil del arrendador:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function verifyPasswordService(id, password) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({ 
      where: { id },
      select: ['id', 'password']
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const isMatch = await comparePassword(password, userFound.password);

    if (!isMatch) return [null, "Contraseña incorrecta"];

    return [true, null];
  } catch (error) {
    console.error("Error al verificar contraseña:", error);
    return [null, "Error interno del servidor"];
  }
}