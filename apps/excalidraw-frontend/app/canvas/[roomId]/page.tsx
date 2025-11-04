import { RoomCanvas } from "@/app/components/RoomCanvas"
import { ProtectedRoute } from "@/app/components/ProtectedRoute"


export default async function CanvasPage({ params }: {
    params: Promise<{
        roomId: string
    }>
}) {
    const { roomId } = await params


    return (
        <ProtectedRoute>
            <RoomCanvas roomId={roomId} />
        </ProtectedRoute>
    )
}
