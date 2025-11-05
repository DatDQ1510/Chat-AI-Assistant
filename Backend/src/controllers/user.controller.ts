import { Request, Response } from "express";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import redisConnection from "../config/redis.js";

// 🧩 Lấy danh sách tất cả người dùng
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "firstname", "lastname", "email"], // ẩn password
    });
    res.json(users);
  } catch (error) {

    res.status(500).json({ message: "Lỗi server khi lấy danh sách người dùng" });
  }
};

// 🎨 Lấy settings của user hiện tại
export const getUserSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {

      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await User.findByPk(userId, {
      attributes: ["id", "email", "firstname", "lastname", "language", "writing_style", "custom_instructions", "roleplay_mode"],
    });

    if (!user) {

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

    res.json(settings);
  } catch (error) {

    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

// ✏️ Cập nhật settings của user
export const updateUserSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {

      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findByPk(userId);
    if (!user) {

      return res.status(404).json({ message: "User not found" });
    }

    const { language, writing_style, custom_instructions, roleplay_mode } = req.body;

    let preferences = "";

    // Update fields if provided
    if (language !== undefined){
      user.language = language;
      preferences += `language: ${language}, `;
    } else {
      preferences += `language: ${user.language}, `;
    }

    if (writing_style !== undefined){
      user.writing_style = writing_style;
      preferences += `writing_style: ${writing_style}, `;
    } else {
      preferences += `writing_style: ${user.writing_style}, `;
    }

    if (custom_instructions !== undefined){
      user.custom_instructions = custom_instructions;
      preferences += `custom_instructions: ${custom_instructions}, `;
    } 
    else {
      preferences += `custom_instructions: ${user.custom_instructions}, `;
    }
    if (roleplay_mode !== undefined){
      user.roleplay_mode = roleplay_mode;
      preferences += `roleplay_mode: ${roleplay_mode}`;
    }
    else {
      preferences += `roleplay_mode: ${user.roleplay_mode}`;
    }

    await user.save();
    const userPerferences_key = `userPreferences:${userId}`;
    await redisConnection.setex(userPerferences_key, 24 * 60 * 60, preferences);
    console.log("Updated user preferences cache:", preferences);
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

    res.status(500).json({ message: "Failed to update settings" });
  }
};
