import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing access token" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "access_secret", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired access token" });
    (req as any).user = user;
    next();
  });
};
