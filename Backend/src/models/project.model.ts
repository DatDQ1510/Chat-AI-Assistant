import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./user.model.js";

interface ProjectAttributes {
  id: string;
  project_name: string;
  user_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes {
  public id!: string;
  public project_name!: string;
  public user_id!: string;
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
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
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

