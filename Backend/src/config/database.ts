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
    logging: console.log, 
    pool: {
      max: 20,           
      min: 5,            
      acquire: 30000,    
      idle: 10000,      
      evict: 1000,       
    }
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(
      { alter: true }
    );
    console.log("✅ Database connected successfully");

  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};
