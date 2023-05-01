

import { DataTypes } from 'sequelize';
import sequelize from './sequelize.js';

const Model = sequelize.define("historylist", {
  songID: DataTypes.INTEGER,
  filename: DataTypes.STRING,
  date_played: DataTypes.STRING,
  duration: DataTypes.INTEGER,
  artist: DataTypes.STRING,
  title: DataTypes.STRING,
  album: DataTypes.STRING,
  albumyear: DataTypes.STRING,
  website: DataTypes.STRING,
  buycd: DataTypes.STRING,
  picture: DataTypes.STRING,
  listeners: DataTypes.STRING,
  label: DataTypes.STRING,
  pline: DataTypes.STRING,
  trackno: DataTypes.INTEGER,
  composer: DataTypes.STRING,
  ISRC: DataTypes.STRING,
  catalog: DataTypes.STRING,
  UPC: DataTypes.STRING,
  songtype: DataTypes.STRING,
  requestID: DataTypes.INTEGER,
  listeners_delta: DataTypes.INTEGER,
  listeners_peak: DataTypes.INTEGER,
  download_file: DataTypes.STRING,
  download_filesize: DataTypes.INTEGER

}, { sequelize, modelName: 'Historylist', freezeTableName: true, timestamps: false });
export default Model;

