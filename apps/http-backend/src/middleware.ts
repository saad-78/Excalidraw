import { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt, { JwtPayload } from "jsonwebtoken"

export function middleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"] ?? "";

    if (!authHeader) {
        return res.status(401).json({
            message: "No token provided"
        });
    }

    // Remove "Bearer " prefix
    const token = authHeader.replace("Bearer ", "");

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        //@ts-ignore
        req.userId = decoded.userId;
        next();
    } catch (e) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}
