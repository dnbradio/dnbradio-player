
import { DataTypes } from 'sequelize';
import sequelize from './sequelize.js';

const Event = sequelize.define("calendaritems", {
  location: DataTypes.INTEGER,
  startDate: DataTypes.STRING,
  endDate: DataTypes.STRING,
  startTime: DataTypes.INTEGER,
  endTime: DataTypes.STRING,
  timezone: DataTypes.STRING,
  lengthMinutes: DataTypes.INTEGER,
  day: DataTypes.STRING,
  type: DataTypes.STRING,
  occurs: DataTypes.STRING,
  reminder: DataTypes.INTEGER,
  sponsoring: DataTypes.STRING,
  host: DataTypes.STRING,
  status: DataTypes.STRING,
  title: DataTypes.STRING,
  description: DataTypes.INTEGER,
  image: DataTypes.STRING,
  tzStartTime2: DataTypes.STRING,
  tzEndTime2: DataTypes.STRING,
  tzRegion: DataTypes.STRING

}, { sequelize, modelName: 'Event', freezeTableName: true, timestamps: false });
export default Event;

