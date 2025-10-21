import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./user.model.js";

interface ConversationAttributes {
  id: number;
  conversation_name: string;
  user_id: number;
  lastSummariedIndex?: number | 0;
  summary?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes {
  public id!: number;
  public conversation_name!: string;
  public user_id!: number;
  public lastSummariedIndex!: number | 0;
  public summary!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // ✅ tự động tạo UUID
      primaryKey: true,
    },
    conversation_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    lastSummariedIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "conversations",
    timestamps: true, // ✅ bật timestamps để Sequelize tự cập nhật
  }
);

// 🔗 Association
Conversation.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Conversation, { foreignKey: "user_id", as: "conversations" });
