"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export default function Home() {
    const [roomId, setRoomId] = useState("")
    const [focusedField, setFocusedField] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/signin")
        } else {
            setIsLoading(false)
        }
    }, [router])

    const handleJoinRoom = () => {
        if (roomId.trim()) {
            router.push(`/canvas/${roomId}`)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && roomId.trim()) {
            handleJoinRoom()
        }
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)
        localStorage.removeItem("token")
        localStorage.removeItem("userId")
        localStorage.removeItem("username")
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push("/signin")
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    <p className="text-slate-400 mt-4">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="fixed top-6 right-6 px-4 py-2 rounded-lg font-bold text-red-400 hover:text-red-300 border-2 border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 transition-all duration-300 flex items-center gap-2 text-sm uppercase z-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <LogOut size={16} />
                {isLoggingOut ? "Logging out..." : "Logout"}
            </button>

            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute -bottom-8 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl shadow-2xl p-10 hover:border-slate-700/50 transition-colors duration-300 animate-slideIn">
                    <div className="mb-8 text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Crafting Rooms
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Connect instantly with people around the world
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                            Room ID
                        </label>
                        <input
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            onFocus={() => setFocusedField(true)}
                            onBlur={() => setFocusedField(false)}
                            onKeyPress={handleKeyPress}
                            type="text"
                            placeholder="Enter room name..."
                            className={`w-full px-4 py-3 rounded-xl border-2 bg-slate-800/50 text-white placeholder-slate-500 transition-all duration-300 outline-none font-medium ${
                                focusedField
                                    ? "border-blue-500/60 bg-slate-800/80 shadow-lg shadow-blue-500/20"
                                    : "border-slate-700/50 hover:border-slate-600/50"
                            }`}
                        />
                    </div>

                    <button
                        onClick={handleJoinRoom}
                        disabled={!roomId.trim()}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-white tracking-wide transition-all duration-300 flex items-center justify-center gap-2 uppercase text-sm mb-4 ${
                            !roomId.trim()
                                ? "bg-slate-700/50 cursor-not-allowed opacity-60"
                                : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95"
                        }`}
                    >
                        Join Room
                    </button>

                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent"></div>
                        <span className="text-slate-500 text-xs font-semibold">OR</span>
                        <div className="flex-1 h-px bg-gradient-to-l from-slate-700 to-transparent"></div>
                    </div>

                    <button
                        onClick={() => router.push("/create-room")}
                        className="w-full py-3 px-4 rounded-xl font-bold text-slate-300 uppercase text-sm tracking-wide border-2 border-slate-700/50 hover:border-slate-600/80 hover:bg-slate-800/50 transition-all duration-300"
                    >
                        Create New Room
                    </button>

                    <p className="mt-8 text-center text-xs text-slate-500 font-medium">
                        📌 Don't have a room ID? Create one to invite others and start chatting
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }

                .animate-slideIn {
                    animation: slideIn 0.5s ease-out;
                }

                .animate-blob {
                    animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    )
}
