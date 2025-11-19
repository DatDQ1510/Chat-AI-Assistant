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
    timezone: "+07:00",
    logging: false,
    
    // SSL configuration for Render PostgreSQL
    dialectOptions: process.env.NODE_ENV === "production" ? {
      ssl: {
        require: true,
        rejectUnauthorized: false // Render uses self-signed certs
      }
    } : {},

    define: {
      freezeTableName: true,  // ⚙️ Không tự đổi tên bảng
      underscored: false,     // ⚙️ Giữ nguyên camelCase (createdAt, updatedAt)
    },

    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
      evict: 1000,
    },
  }
);

export const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log("✅ Database connected successfully");

      await sequelize.sync({
        alter: process.env.NODE_ENV !== "production", // Only alter in dev
      });
      console.log("🧩 Models synchronized");
      return;
    } catch (error) {
      retries++;
      console.error(`❌ Database connection attempt ${retries}/${maxRetries} failed:`, error);
      
      if (retries >= maxRetries) {
        console.error("❌ Max retries reached. Exiting...");
        process.exit(1);
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, retries), 10000);
      console.log(`⏳ Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};
