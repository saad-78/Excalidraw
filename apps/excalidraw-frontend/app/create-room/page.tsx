"use client"

import { useState } from "react"
import axios from "axios"
import { Backend_URL } from "../config"
import { useRouter } from "next/navigation"

export default function CreateRoomPage() {
    const router = useRouter()
    const [roomName, setRoomName] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [focusedField, setFocusedField] = useState(false)

    const handleCreateRoom = async () => {
        if (!roomName.trim()) {
            setError("Room name is required")
            return
        }

        setLoading(true)
        setError("")

        try {
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/signin")
                return
            }

            const response = await axios.post(
                `${Backend_URL}/room`,
                { name: roomName },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            // Redirect to canvas with the roomId
            router.push(`/canvas/${roomName}`)
        } catch (e: any) {
            setError(e.response?.data?.message || "Failed to create room")
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && roomName.trim()) {
            handleCreateRoom()
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute -bottom-8 right-1/4 w-96 h-96 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            {/* Content */}
            <div className="w-full max-w-md relative z-10">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl shadow-2xl p-8 hover:border-slate-700/50 transition-colors duration-300 animate-slideIn">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                            Create Room
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Start a new chat room and invite friends</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium animate-shake backdrop-blur-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Input Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                            Room Name
                        </label>
                        <input
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            onFocus={() => setFocusedField(true)}
                            onBlur={() => setFocusedField(false)}
                            onKeyPress={handleKeyPress}
                            type="text"
                            placeholder="e.g. gaming, work, friends..."
                            maxLength={20}
                            className={`w-full px-4 py-3 rounded-xl border-2 bg-slate-800/50 text-white placeholder-slate-500 transition-all duration-300 outline-none font-medium ${
                                focusedField
                                    ? "border-emerald-500/60 bg-slate-800/80 shadow-lg shadow-emerald-500/20"
                                    : "border-slate-700/50 hover:border-slate-600/50"
                            }`}
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            {roomName.length}/20 characters
                        </p>
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={handleCreateRoom}
                        disabled={!roomName.trim() || loading}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-white tracking-wide transition-all duration-300 flex items-center justify-center gap-2 uppercase text-sm ${
                            !roomName.trim() || loading
                                ? "bg-slate-700/50 cursor-not-allowed"
                                : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 active:scale-95"
                        }`}
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Room...
                            </>
                        ) : (
                            "Create Room"
                        )}
                    </button>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent"></div>
                        <span className="text-slate-500 text-xs font-semibold">OR</span>
                        <div className="flex-1 h-px bg-gradient-to-l from-slate-700 to-transparent"></div>
                    </div>

                    {/* Back Button */}
                    <button
                        onClick={() => router.push("/")}
                        className="w-full py-3 px-4 rounded-xl font-bold text-slate-300 uppercase text-sm tracking-wide border-2 border-slate-700/50 hover:border-slate-600/80 hover:bg-slate-800/50 transition-all duration-300"
                    >
                        Back to Home
                    </button>

                    {/* Footer Text */}
                    <p className="mt-6 text-center text-xs text-slate-500 font-medium">
                        🔐 Share the room name with others to invite them
                    </p>
                </div>
            </div>

            {/* Animations */}
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

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }

                .animate-slideIn {
                    animation: slideIn 0.5s ease-out;
                }

                .animate-shake {
                    animation: shake 0.3s ease-in-out;
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
