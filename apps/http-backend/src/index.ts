import express from "express";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "123123"
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, RoomSchema } from '@repo/common/types';
import { prismaClient } from "@repo/db/client";
import { Prisma } from '@prisma/client'; 
import cors from "cors";
import bcrypt from "bcrypt";

const app = express()

app.use(cors())
app.use(express.json())

app.post('/signup', async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({
            message: "Incorrect inputs"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data.username,
                password: hashedPassword,
                name: parsedData.data.name
            }
        });

        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET, { expiresIn: '24h' });

        return res.status(201).json({
            userId: user.id,
            token  
        });
    } catch (e: any) {
        if (e.code === 'P2002') {
            return res.status(409).json({
                message: "User already exists"
            });
        }
        console.error("Signup error:", e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.post('/signin', async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return
    }

    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
            password: parsedData.data.password
        }
    })
    const userId = 1;

    if (!user) {
        res.status(403).json({
            message: "Not authorized"
        })
        return
    }

    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET)

    res.json({
        token,
        name: user.name 
    })
})

app.post('/room', middleware, async (req, res) => {
    const parsedData = RoomSchema.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({
            message: "Incorrect inputs"
        })
    }

    //@ts-ignore
    const userId = req.userId;

    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })
        return res.status(201).json({
            roomId: room.id
        })
    } catch (e: any) {
        if (e.code === 'P2002') {
            return res.status(409).json({
                message: "Room with that name already exists"
            })
        }

        console.error("Room creation error:", e);

        return res.status(500).json({
            message: "Internal server error"
        })
    }
})

app.get("/chats/:roomId",async(req,res)=>{
    const roomId = Number(req.params.roomId)
   const messages= await prismaClient.chat.findMany({
        where:{
            roomId:roomId
        },
        orderBy:{
            id:"desc"
        }
        ,
        take:50
    })
    res.json({
        messages
    })
})

app.get("/room/:slug",async(req,res)=>{
    const slug = req.params.slug
   const room= await prismaClient.room.findFirst({
        where:{
            slug
        }
    })
    res.json({
        room
    })
})

app.get("/drawings/:roomId", async (req, res) => {
    try {
        const roomSlug = req.params.roomId;
        
        console.log(`Fetching drawings for room: ${roomSlug}`);
        
        const result = await prismaClient.$queryRaw`
            SELECT c.message
            FROM "Chat" c
            JOIN "Room" r ON c."roomId" = r.id
            WHERE r.slug = ${roomSlug}
            ORDER BY c.id ASC
        `;
        //@ts-ignore
        console.log(`Found ${result.length} chats`);

        const drawings = (result as any[])
            .map((chat: any) => {
                try {
                    const parsed = JSON.parse(chat.message);
                    return parsed.shape || null;
                } catch (e) {
                    console.error("Failed to parse:", chat.message);
                    return null;
                }
            })
            .filter(shape => shape !== null);

        console.log(`Returning ${drawings.length} drawings`);
        res.json({ drawings });
    } catch (e) {
        console.error("Error fetching drawings:", e);
        res.status(500).json({ 
            message: "Internal server error",
            error: e instanceof Error ? e.message : String(e)
        });
    }
});

app.post("/drawings", async (req, res) => {
    try {
        const { roomId, message } = req.body;
        
        console.log(`Saving drawing to room: ${roomId}`);
        
        const room = await prismaClient.room.findFirst({
            where: { slug: roomId }
        });

        if (!room) {
            console.log(`Room not found: ${roomId}`);
            return res.json({ success: true }); 
        }

        await prismaClient.chat.create({
            data: {
                roomId: room.id,
                message,
                userId: "system" 
            }
        });

        console.log(`✅ Drawing saved for room ${roomId}`);
        res.json({ success: true });
    } catch (e) {
        console.error("Save error:", e);
        res.json({ success: true }); 
    }
});

app.post('/api/keep-alive', (_req, res) => {
  console.log('✅ HTTP Keep-alive ping received at', new Date().toISOString())
  res.status(200).json({ status: 'alive', service: 'http-backend', timestamp: new Date() })
})

const PORT = process.env.PORT || 3001
//@ts-ignore
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`))
