import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./user.model.js";

interface ProjectAttachment {
  return_url: string;
  public_id: string;
  data: string; // nội dung hoặc đoạn text trích từ file
  summary?: string | null; // nếu file dài
}
interface ProjectAttributes {
  id: string;
  project_name: string;
  description?: string | null;
  user_id: string;
  attachments?: ProjectAttachment[] | null;
  custom_fields?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes {
  public id!: string;
  public project_name!: string;
  public description?: string | null;
  public user_id!: string;
  public attachments?: ProjectAttachment[] | null;
  public custom_fields?: Record<string, any> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // ✅ tự động tạo UUID
      primaryKey: true,
    },
    project_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    custom_fields: {
      type: DataTypes.JSONB,  
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: "projects",
    timestamps: true, 
   }
);

// 🔗 Association
Project.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Project, { foreignKey: "user_id", as: "projects" });

