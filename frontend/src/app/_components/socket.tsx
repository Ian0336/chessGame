'use client'
import React from "react"
import { io } from "socket.io-client";
// import { SOCKET_URL } from "config"

export const socket = io('http://localhost:30602');
export const SocketContext = React.createContext(socket);
