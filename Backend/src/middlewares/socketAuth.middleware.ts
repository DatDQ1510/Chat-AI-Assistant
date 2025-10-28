// middlewares/socketAuth.middleware.ts

import { Socket } from "socket.io";
// Giả sử bạn có một hàm tiện ích để giải mã token
import { verify } from "jsonwebtoken"; 
import config from "../config/config"; // Để lấy secret key

// Khai báo kiểu dữ liệu cho socket để chứa thông tin user
interface SocketAuth extends Socket {
    user?: { id: string, email: string }; // Hoặc bất kỳ thông tin user nào bạn cần
}

export const authenticateSocket = (socket: SocketAuth, next: (err?: Error) => void) => {
    // 1. Lấy token từ handshake.auth (Client đã gửi lên)
    const token = socket.handshake.auth.token as string;

    if (!token) {
        // ❌ Từ chối: Thiếu token
        return next(new Error('Authentication Error: Token missing.'));
    }

    try {
        // 2. Giải mã và xác minh token
        // Thay thế 'YOUR_JWT_SECRET' bằng secret key thực tế
        const payload = verify(token, process.env.ACCESS_TOKEN_SECRET || "access_secret") as any;
        if (!payload || !payload.id) {
            return next(new Error('Authentication Error: Invalid token payload.'));
        }
        socket.user = {
            id: payload.id,
            email: payload.email
        };
        next();
    } catch (error) {
        // ❌ Từ chối: Token không hợp lệ

        return next(new Error('Authentication Error: Invalid token.'));
    }
};