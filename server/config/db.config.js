import 'dotenv/config'

export default {
  HOST: process.env.MYSQL_DB_HOST,
  USER: process.env.MYSQL_DB_USER,
  PASSWORD: process.env.MYSQL_DB_PASS,
  DB: process.env.MYSQL_DB_NAME,
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};