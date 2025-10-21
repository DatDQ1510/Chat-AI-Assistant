import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret";



// Tạo Access Token (hết hạn nhanh)
export const generateAccessToken = (user: { id: string; email: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    ACCESS_SECRET,
    { expiresIn: "1d" }
  );
};

// Tạo Refresh Token (hết hạn dài)
export const generateRefreshToken = (user: { id: string; email: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// Xác thực Access Token
export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET);
};

// Xác thực Refresh Token
export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET);
};
