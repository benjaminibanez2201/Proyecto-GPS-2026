"use strict";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js";
import { AppDataSource } from "../config/configDb.js";
import User from "../entity/user.entity.js";

let ioInstance = null;

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      credentials: true,
      origin: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No autorizado"));

      const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email: payload.email } });

      if (!user) return next(new Error("No autorizado"));

      socket.user = { id: user.id, rol: user.rol };
      next();
    } catch {
      next(new Error("No autorizado"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);
  });

  ioInstance = io;
  return io;
}

export function getIO() {
  return ioInstance;
}
