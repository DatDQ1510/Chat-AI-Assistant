import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

interface MemoryAttributes {
  id: string;
  user_id: string;
  type: string;
  content: string;
  embedding?: number[] | null;
  importance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MemoryCreationAttributes extends Optional<MemoryAttributes, 'id' | 'embedding'> {}

export class Memory extends Model<MemoryAttributes, MemoryCreationAttributes>
  implements MemoryAttributes {
  public id!: string;
  public user_id!: string;
  public type!: string;
  public content!: string;
  public embedding!: number[] | null;
  public importance!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Memory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'fact',
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
    importance: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'createdAt', // 👈 ép Sequelize quote đúng cột
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updatedAt', // 👈 ép Sequelize quote đúng cột
    },
  },
  {
    sequelize,
    tableName: 'user_memories',
    timestamps: true,
  }
);


