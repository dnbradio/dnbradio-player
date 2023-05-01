
import { DataTypes } from 'sequelize';
import sequelize from './sequelize.js';

const Recording = sequelize.define("liveshowhistory", {
  title: DataTypes.STRING,
  filename: DataTypes.STRING,
  alturl: DataTypes.STRING,
  artist: DataTypes.STRING,
  timestamp: DataTypes.STRING,
  userId: DataTypes.STRING,
  historylistId: DataTypes.STRING,
  description: DataTypes.STRING,
  website: DataTypes.STRING,
  picture: DataTypes.STRING,
  cued: DataTypes.STRING,
  recordingFilename: DataTypes.STRING,
  tags: DataTypes.STRING,
  tracklist: DataTypes.STRING,
  genre: DataTypes.STRING,
  rating: DataTypes.STRING,
  mood: DataTypes.STRING,
  label: DataTypes.STRING,
  album: DataTypes.STRING,
  albumyear: DataTypes.STRING,
  archive: DataTypes.STRING,
  recordingSize: DataTypes.STRING,
  recordingLength: DataTypes.STRING,
  rssPublishDate: DataTypes.STRING,
  plays: DataTypes.INTEGER,
  soundcloudQueueId: DataTypes.STRING,
  soundcloudId: DataTypes.STRING,
  soundcloudUrl: DataTypes.STRING,
  posttoSoundcloud: DataTypes.STRING,
  postToSoundcloudTime: DataTypes.STRING,
  active: DataTypes.BOOLEAN
  
}, { sequelize, modelName: 'Recording', freezeTableName: true, timestamps: false });
export default Recording;
