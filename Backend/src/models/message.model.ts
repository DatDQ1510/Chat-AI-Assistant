import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./user.model.js";

interface MessageAttributes {
  id: string;
  conversation_id: string;
  sender_type: "user" | "chatbot";
  user_id: string | null;
  chatbot_id: string | null;
  content: string;
  embedding?: number[] | null;
  createdAt?: Date;
  updatedAt?: Date;
  important?: boolean; 
}

interface MessageCreationAttributes extends Optional<MessageAttributes, "id"> {}

export class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: string;
  public conversation_id!: string;
  public sender_type!: "user" | "chatbot";
  public user_id!: string | null;
  public chatbot_id!: string | null;
  public content!: string;
  public embedding!: number[] | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public important!: boolean;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID ,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sender_type: {
      type: DataTypes.ENUM("user", "chatbot"),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    chatbot_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    embedding: {
      type: "vector(1536)",
      allowNull: true,
      get() {
        return null;
      }
    },
    important: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  },  
  {
    sequelize,
    tableName: "messages",
    timestamps: true,
    underscored: true
  }
);

// index
// Associations
Message.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Message, { foreignKey: "user_id", as: "messages" });
