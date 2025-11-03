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
} | {
    type: "line"
    startX: number
    startY: number
    endX: number
    endY: number
    color?: string
} | {
    type: "arrow"
    startX: number
    startY: number
    endX: number
    endY: number
    color?: string
} | {
    type: "text"
    x: number
    y: number
    content: string
    fontSize: number
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
    private fontSize: number = 16

    // Infinite canvas: pan & zoom
    private offsetX = 0
    private offsetY = 0
    private scale = 1
    private isPanning = false
    private panStartX = 0
    private panStartY = 0
    
    private selectedShapeIndex: number | null = null
    private isMovingShape = false

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
        this.canvas.removeEventListener("wheel", this.wheelHandler)
    }

    setTool(tool: "circle" | "pencil" | "rect" | "line" | "arrow" | "text" | "drag" | "pan" | "eraser") {
      //@ts-ignore
        this.selectedTool = tool
    }

    setColor(color: string) {
        this.selectedColor = color
    }

    setFontSize(size: number) {
        this.fontSize = size
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

    private drawGrid() {
        const gridSize = 50
        this.ctx.strokeStyle = "rgba(100, 100, 100, 0.2)"
        this.ctx.lineWidth = 1

        let startX = this.offsetX % (gridSize * this.scale)
        for (let x = startX; x < this.canvas.width; x += gridSize * this.scale) {
            this.ctx.beginPath()
            this.ctx.moveTo(x, 0)
            this.ctx.lineTo(x, this.canvas.height)
            this.ctx.stroke()
        }

        let startY = this.offsetY % (gridSize * this.scale)
        for (let y = startY; y < this.canvas.height; y += gridSize * this.scale) {
            this.ctx.beginPath()
            this.ctx.moveTo(0, y)
            this.ctx.lineTo(this.canvas.width, y)
            this.ctx.stroke()
        }
    }

    private drawArrowhead(fromX: number, fromY: number, toX: number, toY: number) {
        const headlen = 15
        const angle = Math.atan2(toY - fromY, toX - fromX)
        
        this.ctx.beginPath()
        this.ctx.moveTo(toX, toY)
        this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6))
        this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6))
        this.ctx.closePath()
        this.ctx.fill()
    }

    private isPointInShape(px: number, py: number, shape: Shape): boolean {
        if (shape.type === "rect") {
            return px >= shape.x && px <= shape.x + shape.width &&
                   py >= shape.y && py <= shape.y + shape.height
        } else if (shape.type === "circle") {
            const dx = px - shape.centerX
            const dy = py - shape.centerY
            return Math.sqrt(dx * dx + dy * dy) <= shape.radius + 5
        } else if (shape.type === "line" || shape.type === "arrow") {
            return this.isPointNearLine(px, py, shape.startX, shape.startY, shape.endX, shape.endY)
        } else if (shape.type === "text") {
            return px >= shape.x && px <= shape.x + shape.content.length * 8 &&
                   py >= shape.y - shape.fontSize && py <= shape.y
        }
        return false
    }

    private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, threshold: number = 5): boolean {
        const A = px - x1
        const B = py - y1
        const C = x2 - x1
        const D = y2 - y1

        const dot = A * C + B * D
        const lenSq = C * C + D * D
        let param = -1
        if (lenSq !== 0) param = dot / lenSq

        let xx, yy
        if (param < 0) {
            xx = x1
            yy = y1
        } else if (param > 1) {
            xx = x2
            yy = y2
        } else {
            xx = x1 + param * C
            yy = y1 + param * D
        }

        const dx = px - xx
        const dy = py - yy
        return Math.sqrt(dx * dx + dy * dy) <= threshold
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.fillStyle = "#000000"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.drawGrid()

        this.ctx.save()
        this.ctx.translate(this.offsetX, this.offsetY)
        this.ctx.scale(this.scale, this.scale)

        this.existingShapes.forEach((shape) => {
            this.ctx.strokeStyle = shape.color || "#FFFFFF"
            this.ctx.fillStyle = shape.color || "#FFFFFF"
            this.ctx.lineWidth = 2

            if (shape.type === "rect") {
                this.ctx.beginPath()
                this.ctx.roundRect(shape.x, shape.y, shape.width, shape.height, 8)
                this.ctx.stroke()
                this.ctx.closePath()
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
            } else if (shape.type === "line") {
                this.ctx.beginPath()
                this.ctx.moveTo(shape.startX, shape.startY)
                this.ctx.lineTo(shape.endX, shape.endY)
                this.ctx.stroke()
                this.ctx.closePath()
            } else if (shape.type === "arrow") {
                this.ctx.beginPath()
                this.ctx.moveTo(shape.startX, shape.startY)
                this.ctx.lineTo(shape.endX, shape.endY)
                this.ctx.stroke()
                this.ctx.closePath()
                this.drawArrowhead(shape.startX, shape.startY, shape.endX, shape.endY)
            } else if (shape.type === "text") {
                this.ctx.fillStyle = shape.color || "#FFFFFF"
                this.ctx.font = `${shape.fontSize}px Arial`
                this.ctx.fillText(shape.content, shape.x, shape.y)
            }
        })

        this.ctx.restore()
    }

    mouseDownHandler = (e: any) => {
        const rect = this.canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        if (e.button === 2) {
            this.isPanning = true
            this.panStartX = x
            this.panStartY = y
            return
        }

        // Pan tool: always pan
        if (this.selectedTool === "pan") {
            this.isPanning = true
            this.panStartX = x
            this.panStartY = y
            return
        }

        // Eraser tool: delete shape
        if (this.selectedTool === "eraser") {
            const canvasX = (x - this.offsetX) / this.scale
            const canvasY = (y - this.offsetY) / this.scale

            for (let i = this.existingShapes.length - 1; i >= 0; i--) {
                const shape = this.existingShapes[i]
                if (this.isPointInShape(canvasX, canvasY, shape)) {
                    this.existingShapes.splice(i, 1)
                    this.clearCanvas()
                    
                    this.socket.send(
                        JSON.stringify({
                            type: "chat",
                            message: JSON.stringify({ 
                                action: "delete",
                                index: i
                            }),
                            roomId: this.roomId
                        })
                    )
                    return
                }
            }
            return
        }

        // Drag tool: select shape to move
        if (this.selectedTool === "drag") {
            const canvasX = (x - this.offsetX) / this.scale
            const canvasY = (y - this.offsetY) / this.scale

            for (let i = this.existingShapes.length - 1; i >= 0; i--) {
                const shape = this.existingShapes[i]
                if (this.isPointInShape(canvasX, canvasY, shape)) {
                    this.selectedShapeIndex = i
                    this.isMovingShape = true
                    this.startX = canvasX
                    this.startY = canvasY
                    return
                }
            }
            return
        }

        // Text tool: create text
        if (this.selectedTool === "text") {
            const canvasX = (x - this.offsetX) / this.scale
            const canvasY = (y - this.offsetY) / this.scale
            
            const textContent = prompt("Enter text:")
            if (textContent) {
                const shape: Shape = {
                    type: "text",
                    x: canvasX,
                    y: canvasY,
                    content: textContent,
                    fontSize: this.fontSize,
                    color: this.selectedColor
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
            return
        }

        this.clicked = true
        this.startX = (x - this.offsetX) / this.scale
        this.startY = (y - this.offsetY) / this.scale
    }

    mouseUpHandler = (e: any) => {
        if (this.isPanning) {
            this.isPanning = false
            return
        }

        if (this.isMovingShape && this.selectedShapeIndex !== null) {
            this.isMovingShape = false
            const shape = this.existingShapes[this.selectedShapeIndex]
            this.socket.send(
                JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({ shape }),
                    roomId: this.roomId
                })
            )
            this.selectedShapeIndex = null
            return
        }

        this.clicked = false
        const rect = this.canvas.getBoundingClientRect()
        const endScreenX = e.clientX - rect.left
        const endScreenY = e.clientY - rect.top

        const endX = (endScreenX - this.offsetX) / this.scale
        const endY = (endScreenY - this.offsetY) / this.scale

        const selectedTool = this.selectedTool
        let shape: Shape | null = null

        if (selectedTool === "rect") {
            const x = Math.min(this.startX, endX)
            const y = Math.min(this.startY, endY)
            const width = Math.abs(endX - this.startX)
            const height = Math.abs(endY - this.startY)
            
            if (width < 2 || height < 2) return
            
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
            
            if (radius < 2) return
            
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
         //@ts-ignore
        else if (selectedTool === "line") {
            const dx = Math.abs(endX - this.startX)
            const dy = Math.abs(endY - this.startY)
            
            if (dx < 2 && dy < 2) return
            
            shape = {
                type: "line",
                startX: this.startX,
                startY: this.startY,
                endX: endX,
                endY: endY,
                color: this.selectedColor
            }
        }
         //@ts-ignore
        else if (selectedTool === "arrow") {
            const dx = Math.abs(endX - this.startX)
            const dy = Math.abs(endY - this.startY)
            
            if (dx < 2 && dy < 2) return
            
            shape = {
                type: "arrow",
                startX: this.startX,
                startY: this.startY,
                endX: endX,
                endY: endY,
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
        if (this.isPanning) {
            const rect = this.canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            this.offsetX += x - this.panStartX
            this.offsetY += y - this.panStartY
            this.panStartX = x
            this.panStartY = y
            this.clearCanvas()
            return
        }

        // Move shape
        if (this.isMovingShape && this.selectedShapeIndex !== null) {
            const rect = this.canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            const canvasX = (x - this.offsetX) / this.scale
            const canvasY = (y - this.offsetY) / this.scale

            const shape = this.existingShapes[this.selectedShapeIndex]
            const dx = canvasX - this.startX
            const dy = canvasY - this.startY

            if (shape.type === "rect") {
                shape.x += dx
                shape.y += dy
            } else if (shape.type === "circle") {
                shape.centerX += dx
                shape.centerY += dy
            } else if (shape.type === "line" || shape.type === "arrow") {
                shape.startX += dx
                shape.startY += dy
                shape.endX += dx
                shape.endY += dy
            } else if (shape.type === "text") {
                shape.x += dx
                shape.y += dy
            }

            this.startX = canvasX
            this.startY = canvasY
            this.clearCanvas()
            return
        }

        if (this.clicked) {
            const rect = this.canvas.getBoundingClientRect()
            const endScreenX = e.clientX - rect.left
            const endScreenY = e.clientY - rect.top

            const endX = (endScreenX - this.offsetX) / this.scale
            const endY = (endScreenY - this.offsetY) / this.scale
            
            this.clearCanvas()

            this.ctx.save()
            this.ctx.translate(this.offsetX, this.offsetY)
            this.ctx.scale(this.scale, this.scale)

            this.ctx.strokeStyle = this.selectedColor
            this.ctx.fillStyle = this.selectedColor
            this.ctx.lineWidth = 2
            const selectedTool = this.selectedTool

            if (selectedTool === "rect") {
                const x = Math.min(this.startX, endX)
                const y = Math.min(this.startY, endY)
                const width = Math.abs(endX - this.startX)
                const height = Math.abs(endY - this.startY)
                this.ctx.beginPath()
                this.ctx.roundRect(x, y, width, height, 8)
                this.ctx.stroke()
                this.ctx.closePath()
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
            //@ts-ignore
            else if (selectedTool === "line") {
                this.ctx.beginPath()
                this.ctx.moveTo(this.startX, this.startY)
                this.ctx.lineTo(endX, endY)
                this.ctx.stroke()
                this.ctx.closePath()
            }
            //@ts-ignore
            else if (selectedTool === "arrow") {
                this.ctx.beginPath()
                this.ctx.moveTo(this.startX, this.startY)
                this.ctx.lineTo(endX, endY)
                this.ctx.stroke()
                this.ctx.closePath()
                this.drawArrowhead(this.startX, this.startY, endX, endY)
            }

            this.ctx.restore()
        }
    }

    wheelHandler = (e: WheelEvent) => {
        e.preventDefault()
        
        const rect = this.canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const zoomSpeed = 0.05
        const newScale = this.scale + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)
        
        if (newScale > 0.1 && newScale < 5) {
            this.offsetX = x - (x - this.offsetX) * (newScale / this.scale)
            this.offsetY = y - (y - this.offsetY) * (newScale / this.scale)
            this.scale = newScale
            this.clearCanvas()
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)
        this.canvas.addEventListener("mouseup", this.mouseUpHandler)
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)
        this.canvas.addEventListener("wheel", this.wheelHandler, { passive: false })
        this.canvas.addEventListener("contextmenu", (e) => e.preventDefault())
    }
}
