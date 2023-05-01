
import { DataTypes } from 'sequelize';
import sequelize from './sequelize.js';

const RecordingHit = sequelize.define("file_statistics", {
  filename: DataTypes.STRING,
  timestamp: DataTypes.STRING  
}, { sequelize, modelName: 'RecordingHit', freezeTableName: true, timestamps: false });
export default RecordingHit;
