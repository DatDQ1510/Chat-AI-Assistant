import bcrypt from "bcryptjs";
import  UserRepository  from "../repositories/user.repository";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { User } from "../models/user.model";
import redisConnection from "../config/redis.js";
export class AuthService {

  async login(email: string, password: string, sessionId: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error("User not found");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    const payload = { id: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Lưu token vào Redis, kèm sessionId
    await redisConnection.setex(
      `refresh_token:${user.id}:${sessionId}`,
      7 * 24 * 60 * 60,
      refreshToken
    );
    await redisConnection.setex(
      `access_token:${user.id}:${sessionId}`,
      15 * 60,
      accessToken
    );

    return { accessToken, refreshToken };
  }

  async logout(userId: number, sessionId: string) {
    try {
      // Xóa token của phiên cụ thể
      const refreshKey = `refresh_token:${userId}:${sessionId}`;
      const accessKey = `access_token:${userId}:${sessionId}`;

      await redisConnection.del(refreshKey);
      await redisConnection.del(accessKey);

      return { message: "Logged out successfully" };
    } catch (error) {
      throw new Error("Failed to logout");
    }
  }

async refresh(refreshToken: string, sessionId: string, decoded: { id: number; email: string }) {
  const userId = decoded.id;

  const stored = await redisConnection.get(`refresh_token:${userId}:${sessionId}`);
  if (!stored) throw new Error("Refresh token not found");
  if (stored !== refreshToken) throw new Error("Token mismatch");

  // ❗ KHÔNG tạo refresh token mới mỗi lần refresh
  
  const newAccessToken = generateAccessToken(decoded as any);

  // ✅ Gia hạn lại thời gian sống cho refresh token cũ
  await redisConnection.expire(`refresh_token:${userId}:${sessionId}`, 7 * 24 * 60 * 60);

  return { accessToken: newAccessToken, refreshToken }; 
}

  async register(firstname: string, lastname: string, email: string, password: string) {
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) throw new Error("Email already in use");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    return newUser;
  }
}

export default new AuthService();

