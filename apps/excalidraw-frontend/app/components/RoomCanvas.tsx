"use client"

import axios from "axios"
import { WS_URL, Backend_URL } from "../config"
import { useEffect, useState, useRef } from "react"
import { Canvas } from "./Canvas"

export function RoomCanvas({ roomId }: { roomId: string }) {
    const [socket, setSocket] = useState<WebSocket | null>(null)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [drawings, setDrawings] = useState([])
    const wsRef = useRef<WebSocket | null>(null)
    const mountedRef = useRef(true)

    useEffect(() => {
        mountedRef.current = true
        
        if (wsRef.current) {
            return
        }

        const token = localStorage.getItem("token")

        if (!token) {
            if (mountedRef.current) {
                setError("Not authenticated. Please sign in.")
                setLoading(false)
            }
            return
        }

        const fetchDrawings = async () => {
            try {
                const response = await axios.get(`${Backend_URL}/drawings/${roomId}`)
                console.log("Loaded drawings:", response.data.drawings)
                if (mountedRef.current) {
                    setDrawings(response.data.drawings || [])
                }
            } catch (e) {
                console.error("Failed to load drawings:", e)
            }
        }

        fetchDrawings()

        const ws = new WebSocket(`${WS_URL}?token=${token}`)
        wsRef.current = ws

        ws.onopen = () => {
            console.log("✅ WebSocket connected")
            if (mountedRef.current) {
                setSocket(ws)
                setLoading(false)
                setError("") // Clear any previous errors
            }
            
            const joinData = JSON.stringify({
                type: "join_room",
                roomId
            })
            ws.send(joinData)
        }

        ws.onerror = (error) => {
            console.log("WebSocket error:", error)
            // Don't set error here - wait for onclose
        }

        ws.onclose = (event) => {
            console.log("WebSocket disconnected", event.code, event.reason)
            wsRef.current = null
            
            if (mountedRef.current) {
                // Only show error if we never connected
                if (!socket) {
                    setError("Failed to connect to server")
                    setLoading(false)
                }
                setSocket(null)
            }
        }

        return () => {
            mountedRef.current = false
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }
        }
    }, [roomId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="w-12 h-12 animate-spin text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p className="text-slate-300 font-semibold">Connecting to room...</p>
                </div>
            </div>
        )
    }

    if (error && !socket) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-400 mb-2">⚠️ Connection Error</h1>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.href = "/"}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        )
    }

    if (!socket) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black flex items-center justify-center">
                <p className="text-slate-300">Establishing connection...</p>
            </div>
        )
    }

    return <Canvas roomId={roomId} socket={socket} historicalDrawings={drawings} />
}
