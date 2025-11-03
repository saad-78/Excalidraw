import {z} from "zod"


export const CreateUserSchema = z.object({
    username:z.string().min(1).max(255),
    password:z.string(),
    name:z.string()
})

export const SigninSchema = z.object({
    username:z.string().min(1).max(255),
    password:z.string(),
})

export const RoomSchema = z.object({
    name:z.string().min(1).max(20),
})