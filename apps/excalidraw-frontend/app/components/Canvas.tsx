"use client"

import { useEffect, useRef, useState } from "react"
import { IconButton } from "./IconButton"
import { Circle, RectangleHorizontalIcon, LogOut, Home, Trash2, Loader2, Minus, Type, MoreVertical, Palette, Hand, ArrowRight, MousePointer2, Eraser, Settings } from "lucide-react"
import { Game } from "../draw/Game"
import { useRouter } from "next/navigation"

export type Tool = "circle" | "rect" | "drag" | "line" | "arrow" | "text" | "pan" | "eraser"

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
    const [selectedTool, setSelectedTool] = useState<Tool>("drag")
    const [selectedColor, setSelectedColor] = useState("#FFFFFF")
    const [fontSize, setFontSize] = useState(16)
    const [showSettings, setShowSettings] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const router = useRouter()

    useEffect(() => {
        //@ts-ignore
        game?.setTool(selectedTool)
    }, [selectedTool, game])

    useEffect(() => {
        game?.setColor(selectedColor)
    }, [selectedColor, game])

    useEffect(() => {
        game?.setFontSize(fontSize)
    }, [fontSize, game])

    useEffect(() => {
        if (!canvasRef.current) return

        let destroyed = false

        const ensureOpen = () =>
            new Promise<void>((resolve) => {
                if (socket.readyState === WebSocket.OPEN) return resolve()
                const onOpen = () => {
                    socket.removeEventListener("open", onOpen)
                    resolve()
                }
                socket.addEventListener("open", onOpen)
            })

        ;(async () => {
            await ensureOpen()
            if (destroyed) return
            const g = new Game(canvasRef.current!, roomId, socket)
            g.setColor(selectedColor)
            g.setFontSize(fontSize)
            setGame(g)
        })()

        return () => {
            destroyed = true
        }
    }, [canvasRef, socket, roomId])

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
            setShowMenu(false)
        }
    }

    return (
        <div className="h-screen overflow-hidden bg-black">
            <canvas 
                ref={canvasRef} 
                width={typeof window !== 'undefined' ? window.innerWidth : 1920}
                height={typeof window !== 'undefined' ? window.innerHeight : 1080}
            />
            
            <Topbar 
                setSelectedTool={setSelectedTool} 
                selectedTool={selectedTool}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                fontSize={fontSize}
                setFontSize={setFontSize}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
                roomId={roomId}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
                onLogout={handleLogout}
                onLeaveRoom={handleLeaveRoom}
                onClearCanvas={handleClearCanvas}
            />
        </div>
    )
}

function Topbar({
    selectedTool,
    setSelectedTool,
    selectedColor,
    setSelectedColor,
    fontSize,
    setFontSize,
    showSettings,
    setShowSettings,
    roomId,
    showMenu,
    setShowMenu,
    onLogout,
    onLeaveRoom,
    onClearCanvas
}: {
    selectedTool: Tool
    setSelectedTool: (s: Tool) => void
    selectedColor: string
    setSelectedColor: (c: string) => void
    fontSize: number
    setFontSize: (size: number) => void
    showSettings: boolean
    setShowSettings: (show: boolean) => void
    roomId: string
    showMenu: boolean
    setShowMenu: (show: boolean) => void
    onLogout: () => void
    onLeaveRoom: () => void
    onClearCanvas: () => void
}) {
    const [loggingOut, setLoggingOut] = useState(false)

    const handleLogout = async () => {
        setLoggingOut(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        onLogout()
    }

    return (
        <>
            {/* Left Side - Settings Panel (Mobile & Desktop) */}
            <div className="fixed top-8 left-6 z-40">
                <div className="relative">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="bg-slate-900/90 hover:bg-slate-800/90 backdrop-blur-lg p-2 md:p-3 rounded-lg border border-slate-800/50 shadow-2xl transition-all hover:scale-110"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>

                    {showSettings && (
                        <div className="absolute top-14 left-0 bg-slate-900/95 backdrop-blur-lg p-3 md:p-4 rounded-xl border border-slate-800/50 shadow-2xl w-80 md:w-96">
                            {/* Color Palette Section */}
                            <div className="mb-4">
                                <div className="text-slate-400 text-xs font-bold uppercase mb-3 px-1">Color</div>
                                <div className="grid grid-cols-5 gap-2">
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-8 h-8 md:w-10 md:h-10 rounded-lg transition-all ${
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

                            {/* Font Size Section */}
                            <div className="border-t border-slate-700/50 pt-4">
                                <div className="text-slate-400 text-xs font-bold uppercase mb-3 px-1 text-center">Font Size</div>
                                <input 
                                    type="range" 
                                    min="8" 
                                    max="48" 
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="text-slate-300 text-xs mt-2 text-center font-bold">{fontSize}px</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Center - Tools (Horizontal Scroll on Mobile) */}
            <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-40">
                <div className="flex gap-1 md:gap-2 bg-slate-900/90 backdrop-blur-lg p-2 md:p-3 rounded-xl border border-slate-800/50 shadow-2xl overflow-x-auto max-w-[calc(100vw-140px)] md:max-w-none">
                    <IconButton 
                        onClick={() => setSelectedTool("pan")}
                        activated={selectedTool === "pan"}
                        icon={<MousePointer2 size={18} />}
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("drag")}
                        activated={selectedTool === "drag"}
                        icon={<Hand size={18} />}
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("rect")} 
                        activated={selectedTool === "rect"} 
                        icon={<RectangleHorizontalIcon size={18} />}
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("circle")}
                        activated={selectedTool === "circle"} 
                        icon={<Circle size={18} />}
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("line")}
                        activated={selectedTool === "line"}
                        icon={<Minus size={18} />}
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("arrow")}
                        activated={selectedTool === "arrow"}
                        icon={<ArrowRight size={18} />}
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("text")}
                        activated={selectedTool === "text"}
                        icon={<Type size={18} />}
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("eraser")}
                        activated={selectedTool === "eraser"}
                        icon={<Eraser size={18} />}
                    />
                </div>
            </div>

            {/* Top Right - Menu Button (Mobile Friendly) */}
            <div className="fixed top-8 right-6 md:right-8 z-40">
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="bg-slate-900/90 hover:bg-slate-800/90 backdrop-blur-lg p-2 md:p-3 rounded-lg border border-slate-800/50 shadow-2xl transition-all hover:scale-110"
                        title="Menu"
                    >
                        <MoreVertical size={20} />
                    </button>

                    {showMenu && (
                        <div className="absolute top-14 right-0 bg-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-800/50 shadow-2xl overflow-hidden min-w-max text-sm md:text-base">
                            <div className="p-2 md:p-3 border-b border-slate-800/50 bg-slate-800/30">
                                <div className="text-slate-300 text-xs font-bold px-2 py-1 truncate max-w-[200px]">{roomId}</div>
                            </div>
                            <button
                                onClick={onClearCanvas}
                                className="w-full text-left px-3 md:px-4 py-2 md:py-3 hover:bg-slate-800/50 text-orange-400 hover:text-orange-300 transition-all flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                <span>Clear</span>
                            </button>
                            <button
                                onClick={onLeaveRoom}
                                className="w-full text-left px-3 md:px-4 py-2 md:py-3 hover:bg-slate-800/50 text-slate-300 hover:text-white transition-all flex items-center gap-2"
                            >
                                <Home size={16} />
                                <span>Leave</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="w-full text-left px-3 md:px-4 py-2 md:py-3 hover:bg-slate-800/50 text-red-400 hover:text-red-300 transition-all flex items-center gap-2 disabled:opacity-50 border-t border-slate-800/50"
                            >
                                {loggingOut ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Logging out...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
