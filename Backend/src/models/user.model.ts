import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";

interface UserAttributes {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  language?: string; // ✅ Ngôn ngữ trả lời: vi, en, ja, ...
  writing_style?: string; // ✅ Văn phong: formal, casual, technical, friendly
  custom_instructions?: string; // ✅ Custom AI behavior instructions
  roleplay_mode?: string; // ✅ AI roleplay: mentor, tutor, friend, professional
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: string;
  public firstname!: string;
  public lastname!: string;
  public email!: string;
  public password!: string;
  public language?: string;
  public writing_style?: string;
  public custom_instructions?: string;
  public roleplay_mode?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // ✅ PostgreSQL sẽ tự sinh UUID v4
      primaryKey: true,
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'en', // ✅ Mặc định tiếng Anh
    },
    writing_style: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'friendly', // ✅ Mặc định thân thiện
    },
    custom_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    roleplay_mode: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null, // ✅ No roleplay by default
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true, 
  }
);
