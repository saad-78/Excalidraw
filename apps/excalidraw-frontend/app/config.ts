// src/config.ts

const isDev = process.env.NODE_ENV === 'development';

export const Backend_URL = isDev 
  ? "http://localhost:3001"
  : "https://excalidraw-http-backend.onrender.com";

export const WS_URL = isDev 
  ? "ws://localhost:10000/ws"
  : "wss://excalidraw-sozx.onrender.com/ws";
