
import { DataTypes } from 'sequelize';
import sequelize from './sequelize.js';

const User = sequelize.define("users", {
  username: DataTypes.STRING,
  email: DataTypes.STRING  
}, { sequelize, modelName: 'User', freezeTableName: true, timestamps: false });
export default User;
