import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";




const wss = new WebSocketServer({ port: 8080 });




interface User {
    ws: WebSocket;
    rooms: string[];
    userId: string;
}




const users: User[] = [];




function checkUser(token: string): string | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;




        if (typeof decoded === "string" || !decoded || !decoded.userId) {
            return null;
        }




        return decoded.userId;
    } catch (e) {
        console.error("JWT verification failed:", e);
        return null;
    }
}




wss.on('connection', function connection(ws, request) {
    const url = request.url;




    console.log("📡 New connection attempt");




    if (!url) {
        console.log("❌ No URL provided");
        ws.close(1008, "No URL provided");
        return;
    }




    let userId: string | null = null;




    try {
        const queryParams = new URLSearchParams(url.split("?")[1]);
        const token = queryParams.get('token') || "";




        console.log("🔑 Token received");




        userId = checkUser(token);




        console.log("👤 UserId:", userId);




        if (userId === null) {
            console.log("❌ Unauthorized - Invalid token");
            ws.close(1008, "Unauthorized");
            return;
        }




        users.push({
            userId,
            rooms: [],
            ws
        });




        console.log(`✅ User ${userId} connected. Total users: ${users.length}`);




        ws.on('message', async function message(data) {
            try {
                const parsedData = JSON.parse(data as unknown as string);




                if (parsedData.type === "join_room") {
                    const user = users.find(x => x.ws === ws);
                    if (user && !user.rooms.includes(parsedData.roomId)) {
                        user.rooms.push(parsedData.roomId);
                        console.log(`User ${userId} joined room ${parsedData.roomId}. Rooms: ${user.rooms.join(", ")}`);
                    }
                }




                if (parsedData.type === "leave_room") {
                    const user = users.find(x => x.ws === ws);
                    if (user) {
                        user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
                    }
                }




                if (parsedData.type === "chat") {
                    const roomSlug = parsedData.roomId;
                    const message = parsedData.message;

                    // Broadcast IMMEDIATELY - don't wait for database
                    users.forEach(user => {
                        if (user.rooms.some(r => r === roomSlug)) {
                            user.ws.send(JSON.stringify({
                                type: "chat",
                                message: message,
                                roomId: roomSlug
                            }));
                        }
                    });

                    // Save to database in background (non-blocking)
                    ;(async () => {
                        try {
                            const room = await prismaClient.room.upsert({
                                where: { slug: roomSlug },
                                update: {},
                                create: {
                                    slug: roomSlug,
                                    //@ts-ignore
                                    adminId: userId,
                                },
                            });

                            await prismaClient.chat.create({
                                data: {
                                    roomId: room.id,
                                    message: message,
                                    //@ts-ignore
                                    userId: userId,
                                },
                            });

                            console.log(`[DB] Saved drawing to room '${roomSlug}' (ID: ${room.id})`);
                        } catch (e) {
                            console.error("[DB] Failed to save drawing:", e);
                        }
                    })();
                }



                if (parsedData.type === "clear") {
                    const roomSlug = parsedData.roomId;



                    console.log(`[CLEAR] User ${userId} cleared room ${roomSlug}`);


                    users.forEach(user => {
                        if (user.rooms.some(r => r.toString() === roomSlug.toString())) {
                            user.ws.send(JSON.stringify({
                                type: "clear",
                                roomId: roomSlug
                            }));
                        }
                    });
                }




            } catch (e) {
                console.error("Message parsing error:", e);
            }
        });




        ws.on('close', function () {
            const index = users.findIndex(u => u.ws === ws);
            if (index !== -1) {
                users.splice(index, 1);
                console.log(`User ${userId} disconnected. Total users: ${users.length}`);
            }
        });




        ws.on('error', function (e) {
            console.error("WebSocket error for user", userId, ":", e);
        });




    } catch (e) {
        console.error("Connection error:", e);
        ws.close(1011, "Server error");
    }
});




console.log("WebSocket server running on ws://localhost:8080");
