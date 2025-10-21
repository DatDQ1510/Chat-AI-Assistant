import { Request, Response } from "express";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";

// 🧩 Lấy danh sách tất cả người dùng
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "firstname", "lastname", "email"], // ẩn password
    });
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách người dùng" });
  }
};

// 🎨 Lấy settings của user hiện tại
export const getUserSettings = async (req: Request, res: Response) => {
  try {
    console.log("📝 Fetching user settings...");
    const userId = req.user?.id;
    if (!userId) {
      console.warn("⚠️ No user ID in request");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log("👤 User ID:", userId);
    const user = await User.findByPk(userId, {
      attributes: ["id", "email", "firstname", "lastname", "language", "writing_style", "custom_instructions", "roleplay_mode"],
    });

    if (!user) {
      console.warn("⚠️ User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    const settings = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      language: user.language || 'en',
      writing_style: user.writing_style || 'friendly',
      custom_instructions: user.custom_instructions || '',
      roleplay_mode: user.roleplay_mode || '',
    };

    console.log("✅ Settings fetched successfully:", settings);
    res.json(settings);
  } catch (error) {
    console.error("❌ Error fetching user settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

// ✏️ Cập nhật settings của user
export const updateUserSettings = async (req: Request, res: Response) => {
  try {
    console.log("📝 Updating user settings...");
    const userId = req.user?.id;
    if (!userId) {
      console.warn("⚠️ No user ID in request");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      console.warn("⚠️ User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    const { language, writing_style, custom_instructions, roleplay_mode } = req.body;
    console.log("📦 Update payload:", { language, writing_style, custom_instructions, roleplay_mode });

    // Update fields if provided
    if (language !== undefined) user.language = language;
    if (writing_style !== undefined) user.writing_style = writing_style;
    if (custom_instructions !== undefined) user.custom_instructions = custom_instructions;
    if (roleplay_mode !== undefined) user.roleplay_mode = roleplay_mode;

    await user.save();

    console.log("✅ Settings updated successfully");
    res.json({
      message: "Settings updated successfully",
      settings: {
        language: user.language,
        writing_style: user.writing_style,
        custom_instructions: user.custom_instructions,
        roleplay_mode: user.roleplay_mode,
      },
    });
  } catch (error) {
    console.error("❌ Error updating user settings:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
};
