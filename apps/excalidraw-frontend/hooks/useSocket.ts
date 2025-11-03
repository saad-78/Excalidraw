import { useEffect, useState } from "react";
import { WS_URL } from "@/app/config";

export function useSocket() {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
        const token = localStorage.getItem("token");
        
        if (!token) {
            console.error("No auth token found");
            setLoading(false);
            return;
        }

        console.log("Attempting to connect with token:", token.substring(0, 20) + "...");
        
        const ws = new WebSocket(`${WS_URL}?token=${token}`);
        
        ws.onopen = () => {
            console.log(" WebSocket connected");
            setLoading(false);
            setSocket(ws);
        };

        ws.onerror = (error) => {
            console.error(" WebSocket error:", error);
            setLoading(false);
        };

        ws.onclose = (event) => {
            console.log("WebSocket closed:", event.code, event.reason);
            setLoading(true);
        };

        ws.onmessage = (event) => {
            console.log("WebSocket message received:", event.data);
        };

        return () => ws.close();
    }, []);

    return { socket, loading };
}

