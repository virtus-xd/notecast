/**
 * Socket.IO client instance
 * Tek bağlantı — tüm uygulama boyunca paylaşılır
 */

import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env["NEXT_PUBLIC_API_URL"]?.replace("/api", "") ?? "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket(userId?: string): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.once("connect", () => {
      if (userId) s.emit("subscribe:user", userId);
    });
  }
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
