
import { DataTypes } from 'sequelize';
import sequelize from './sequelize.js';

const UserProfile = sequelize.define("user_profiles", {
  typeId: DataTypes.STRING,
  userId: DataTypes.STRING,
  name: DataTypes.STRING
}, { sequelize, modelName: 'UserProfile', freezeTableName: true, timestamps: false });
export default UserProfile;
