// src/hooks/useSocket.js
import { useEffect } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

const baseUrl = import.meta.env.VITE_BASE_URL;

const socket = io(baseUrl);

const useSocket = () => {
  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to socket server with ID:", socket.id);
    });

    if (!user) return;

    socket.emit("register_user", user._id);
    console.log(`User ${user._id} registered`);

    return () => {
      socket.off("connect");
      socket.disconnect();
    };
  }, [user]);

  return socket;
};

export default useSocket;
