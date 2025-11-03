import axios from "axios"
import { Backend_URL } from "../config"

export async function getExistingShapes(roomId: string) {
    try {
        const response = await axios.get(`${Backend_URL}/drawings/${roomId}`)
        console.log("Fetched drawings:", response.data.drawings)
        return response.data.drawings || []
    } catch (e) {
        console.error("Failed to fetch existing shapes:", e)
        return []
    }
}
