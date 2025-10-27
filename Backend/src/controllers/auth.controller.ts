import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { verifyRefreshToken } from "../utils/jwt.js";
import { v4 as uuidv4 } from "uuid";

const authService = new AuthService();

/**
 * @desc   Register a new user
 * @route  POST /api/auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    const user = await authService.register(firstname, lastname, email, password);
    const { password: _, ...userWithoutPassword } = user.get({ plain: true });

    res.status(201).json(successResponse(userWithoutPassword, "Tạo tài khoản thành công"));
  } catch (err: any) {
    next(err); // 👉 gửi lỗi đến errorHandler
  }
};

/**
 * @desc   User login → tạo accessToken + refreshToken + sessionId
 * @route  POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // ✅ Tạo sessionId riêng cho từng tab/thiết bị
    const sessionId = uuidv4();

    // Gọi service login → trả về token
    const { accessToken, refreshToken } = await authService.login(email, password, sessionId);

    // ✅ Lưu refreshToken vào cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ Trả sessionId về FE (FE cần giữ để dùng khi refresh hoặc logout tab đó)
    res.status(200).json(
      successResponse({ accessToken, sessionId }, "Login successful")
    );
  } catch (err: any) {
    next(err);
  }
};

/**
 * @desc   Refresh access token bằng refresh token
 * @route  POST /api/auth/refresh
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  console.log("🔥 Refresh API called");
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log("👉 Cookie refreshToken:", refreshToken);

    const { sessionId } = req.body;
    console.log("👉 sessionId from body:", sessionId);

    if (!refreshToken || !sessionId) {
      return res.status(401).json(errorResponse("Missing refresh token or session ID"));
    }
    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || typeof decoded === "string" || !decoded.id) {
      return res.status(401).json(errorResponse("Invalid refresh token"));
    }

    // ✅ Gọi service để tạo token mới cho đúng session
    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(
      refreshToken,
      sessionId,
      decoded as { id: string; email: string }
    );
    console.log('New refresh token generated:', newRefreshToken);
    // Cập nhật cookie refreshToken mới
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/", // 👉 Đảm bảo cookie được gửi đến tất cả các route
    });

    res.status(200).json(successResponse({ accessToken }, "Token refreshed"));
  } catch (err: any) {
    next(err);
  }
};

/**
 * @desc   Logout một session cụ thể
 * @route  POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;
    const refreshToken = req.cookies.refreshToken;
    if (!sessionId || !refreshToken) {
      return res.status(400).json(errorResponse("Missing sessionId or token"));
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || typeof decoded === "string" || !decoded.id) {
      return res.status(401).json(errorResponse("Invalid token"));
    }

    await authService.logout(decoded.id, sessionId);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: 0
    });
    res.status(200).json(successResponse({}, "Logged out successfully"));
  } catch (err: any) {
    next(err);
  }
};
