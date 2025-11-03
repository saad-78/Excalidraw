import { Tool } from "../components/Canvas"
import { getExistingShapes } from "./http"

type Shape = {
    type: "rect"
    x: number
    y: number
    width: number
    height: number
    color?: string
} | {
    type: "circle"
    centerX: number
    centerY: number
    radius: number
    color?: string
} | {
    type: "pencil"
    startX: number
    startY: number
    endX: number
    endY: number
    color?: string
}

export class Game {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    public existingShapes: Shape[]
    private roomId: string
    private clicked: boolean
    private startX = 0
    private startY = 0
    private selectedTool: Tool = "circle"
    private selectedColor: string = "#FFFFFF"

    socket: WebSocket

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas
        this.ctx = canvas.getContext("2d")!
        this.existingShapes = []
        this.roomId = roomId
        this.socket = socket
        this.clicked = false
        this.init()
        this.initHandlers()
        this.initMouseHandlers()
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
    }

    setTool(tool: "circle" | "pencil" | "rect") {
        this.selectedTool = tool
    }

    setColor(color: string) {
        this.selectedColor = color
    }

    clearAll() {
        this.existingShapes = []
        this.clearCanvas()
        
        this.socket.send(
            JSON.stringify({
                type: "clear",
                roomId: this.roomId
            })
        )
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId)
        console.log("Loaded existing shapes:", this.existingShapes)
        this.clearCanvas()
    }

    redraw(historicalDrawings: Shape[]) {
        this.existingShapes = [...this.existingShapes, ...historicalDrawings]
        this.clearCanvas()
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data)

            if (message.type === "chat") {
                try {
                    const parsedShape = JSON.parse(message.message)
                    if (parsedShape.shape) {
                        this.existingShapes.push(parsedShape.shape)
                        this.clearCanvas()
                    }
                } catch (e) {
                    console.error("Failed to parse shape:", e)
                }
            }

            if (message.type === "clear") {
                this.existingShapes = []
                this.clearCanvas()
            }
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.fillStyle = "rgba(15, 23, 42)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.existingShapes.forEach((shape) => {
            this.ctx.strokeStyle = shape.color || "#FFFFFF"
            this.ctx.lineWidth = 2

            if (shape.type === "rect") {
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
            } else if (shape.type === "circle") {
                this.ctx.beginPath()
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2)
                this.ctx.stroke()
                this.ctx.closePath()
            } else if (shape.type === "pencil") {
                this.ctx.beginPath()
                this.ctx.moveTo(shape.startX, shape.startY)
                this.ctx.lineTo(shape.endX, shape.endY)
                this.ctx.stroke()
                this.ctx.closePath()
            }
        })
    }

    mouseDownHandler = (e: any) => {
        this.clicked = true
        this.startX = e.clientX
        this.startY = e.clientY
    }

    mouseUpHandler = (e: any) => {
        this.clicked = false
        const endX = e.clientX
        const endY = e.clientY

        const selectedTool = this.selectedTool
        let shape: Shape | null = null

        if (selectedTool === "rect") {
            const x = Math.min(this.startX, endX)
            const y = Math.min(this.startY, endY)
            const width = Math.abs(endX - this.startX)
            const height = Math.abs(endY - this.startY)
            
            shape = {
                type: "rect",
                x,
                y,
                height,
                width,
                color: this.selectedColor
            }
        } else if (selectedTool === "circle") {
            const dx = endX - this.startX
            const dy = endY - this.startY
            const radius = Math.sqrt(dx * dx + dy * dy) / 2
            const centerX = this.startX + dx / 2
            const centerY = this.startY + dy / 2
            
            shape = {
                type: "circle",
                radius: radius,
                centerX: centerX,
                centerY: centerY,
                color: this.selectedColor
            }
        }

        if (!shape) {
            return
        }

        this.existingShapes.push(shape)
        this.clearCanvas()

        this.socket.send(
            JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape }),
                roomId: this.roomId
            })
        )
    }

    mouseMoveHandler = (e: any) => {
        if (this.clicked) {
            const endX = e.clientX
            const endY = e.clientY
            this.clearCanvas()

            this.ctx.strokeStyle = this.selectedColor
            this.ctx.lineWidth = 2
            const selectedTool = this.selectedTool

            if (selectedTool === "rect") {
                const x = Math.min(this.startX, endX)
                const y = Math.min(this.startY, endY)
                const width = Math.abs(endX - this.startX)
                const height = Math.abs(endY - this.startY)
                this.ctx.strokeRect(x, y, width, height)
            } else if (selectedTool === "circle") {
                const dx = endX - this.startX
                const dy = endY - this.startY
                const radius = Math.sqrt(dx * dx + dy * dy) / 2
                const centerX = this.startX + dx / 2
                const centerY = this.startY + dy / 2
                this.ctx.beginPath()
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                this.ctx.stroke()
                this.ctx.closePath()
            }
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)
        this.canvas.addEventListener("mouseup", this.mouseUpHandler)
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)
    }
}
