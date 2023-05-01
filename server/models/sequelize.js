import 'dotenv/config'
import { Sequelize, Model, DataTypes } from 'sequelize';
import dbConfig from '../config/db.config.js'

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  },
  dialectOptions: {
    ssl: {
      rejectUnauthorized: true,
    },
  },
  define: {
    timestamps: false,
  },
});

export default sequelize;