"use client"

import { initDraw } from "../draw"
import { useEffect, useRef, useState } from "react"
import { IconButton } from "./IconButton"
import { Circle, Pencil, RectangleHorizontalIcon, LogOut, Home, Trash2, Loader2 } from "lucide-react"
import { Game } from "../draw/Game"
import { useRouter } from "next/navigation"

export type Tool = "circle" | "rect" | "pencil"

const COLORS = [
    "#FFFFFF",
    "#EF4444",
    "#F59E0B",
    "#EAB308",
    "#22C55E",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#000000",
]

export function Canvas({
    roomId,
    socket,
    historicalDrawings = []
}: {
    socket: WebSocket
    roomId: string
    historicalDrawings?: any[]
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [game, setGame] = useState<Game>()
    const [selectedTool, setSelectedTool] = useState<Tool>("circle")
    const [selectedColor, setSelectedColor] = useState("#FFFFFF")
    const router = useRouter()

    useEffect(() => {
        game?.setTool(selectedTool)
    }, [selectedTool, game])

    useEffect(() => {
        game?.setColor(selectedColor)
    }, [selectedColor, game])

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket)
            g.setColor(selectedColor)
            
            console.log("🎨 Historical drawings to load:", historicalDrawings)
            
            // Load historical drawings
            if (historicalDrawings.length > 0) {
                historicalDrawings.forEach(shape => {
                    console.log("Loading shape:", shape)
                    g.existingShapes.push(shape)
                })
                g.clearCanvas()
            }
            fetch('http://localhost:3001/drawings/kim').then(r => r.json()).then(console.log)

            setGame(g)

            return () => {
                g.destroy()
            }
        }
    }, [canvasRef])

    const handleLogout = async () => {
        localStorage.removeItem("token")
        localStorage.removeItem("userId")
        localStorage.removeItem("username")
        router.push("/signin")
    }

    const handleLeaveRoom = () => {
        router.push("/")
    }

    const handleClearCanvas = () => {
        if (game && confirm("Clear all drawings? This cannot be undone.")) {
            game.clearAll()
        }
    }

    return (
        <div className="h-screen overflow-hidden bg-slate-950">
            <canvas 
                ref={canvasRef} 
                width={window.innerWidth} 
                height={window.innerHeight}
            />
            
            <Header 
                roomId={roomId} 
                onLogout={handleLogout} 
                onLeaveRoom={handleLeaveRoom}
                onClearCanvas={handleClearCanvas}
            />
            
            <Topbar 
                setSelectedTool={setSelectedTool} 
                selectedTool={selectedTool}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
            />
        </div>
    )
}

function Header({ 
    roomId, 
    onLogout, 
    onLeaveRoom,
    onClearCanvas
}: { 
    roomId: string
    onLogout: () => void
    onLeaveRoom: () => void
    onClearCanvas: () => void
}) {
    const [username, setUsername] = useState("")
    const [loggingOut, setLoggingOut] = useState(false)

    useEffect(() => {
        const storedName = localStorage.getItem("username")
        setUsername(storedName || "User")
    }, [])

    const handleLogout = async () => {
        setLoggingOut(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        onLogout()
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800/50">
            <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-slate-400 text-sm font-medium">Room:</span>
                        <span className="text-white font-bold text-lg">{roomId}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-200 font-medium">{username}</span>
                    </div>

                    <button
                        onClick={onClearCanvas}
                        className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 rounded-lg border border-orange-500/30 hover:border-orange-500/50 transition-all duration-200 flex items-center gap-2 font-medium"
                    >
                        <Trash2 size={16} />
                        Clear
                    </button>

                    <button
                        onClick={onLeaveRoom}
                        className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 flex items-center gap-2 font-medium"
                    >
                        <Home size={16} />
                        Leave
                    </button>

                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loggingOut ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Logging out...
                            </>
                        ) : (
                            <>
                                <LogOut size={16} />
                                Logout
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Topbar({
    selectedTool,
    setSelectedTool,
    selectedColor,
    setSelectedColor
}: {
    selectedTool: Tool
    setSelectedTool: (s: Tool) => void
    selectedColor: string
    setSelectedColor: (c: string) => void
}) {
    return (
        <div className="fixed top-20 left-6 z-40 flex flex-col gap-3">
            <div className="flex gap-2 bg-slate-900/80 backdrop-blur-lg p-2 rounded-xl border border-slate-800/50 shadow-2xl">
                <IconButton 
                    onClick={() => setSelectedTool("pencil")}
                    activated={selectedTool === "pencil"}
                    icon={<Pencil size={20} />}
                />
                <IconButton 
                    onClick={() => setSelectedTool("rect")} 
                    activated={selectedTool === "rect"} 
                    icon={<RectangleHorizontalIcon size={20} />} 
                />
                <IconButton 
                    onClick={() => setSelectedTool("circle")}
                    activated={selectedTool === "circle"} 
                    icon={<Circle size={20} />}
                />
            </div>

            <div className="bg-slate-900/80 backdrop-blur-lg p-3 rounded-xl border border-slate-800/50 shadow-2xl">
                <div className="text-slate-400 text-xs font-bold uppercase mb-2 px-1">Color</div>
                <div className="grid grid-cols-3 gap-2">
                    {COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                                selectedColor === color
                                    ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 scale-110"
                                    : "hover:scale-105"
                            }`}
                            style={{ 
                                backgroundColor: color,
                                border: color === "#FFFFFF" ? "2px solid #475569" : "none"
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
