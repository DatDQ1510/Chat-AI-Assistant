import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "postgres",
    logging: false,
    timezone: "+07:00", // Đặt múi giờ về GMT+7
    pool: {
      max: 20,           // tối đa 20 connections
      min: 5,            // giữ ít nhất 5 connection (giống Tomcat keep-alive)
      acquire: 30000,    // timeout khi không lấy được connection
      idle: 10000,       // đóng connection idle sau 10s
      evict: 1000,       // chu kỳ kiểm tra connection lỗi  
    }
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};
