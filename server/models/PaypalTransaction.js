
import { DataTypes } from 'sequelize';
import sequelize from './sequelize.js';
import User from './User.js';

const PaypalTransaction = sequelize.define("paypal_history", {
  date: DataTypes.STRING,
  time: DataTypes.STRING,
  tzone: DataTypes.STRING,
  name: DataTypes.STRING,
  gross: DataTypes.STRING,
  fromEmail: DataTypes.STRING,
  userId: DataTypes.INTEGER
}, { sequelize, modelName: 'PaypalTransaction', freezeTableName: true, timestamps: false });

PaypalTransaction.belongsTo(User, {foreignKey: 'userId'})

export default PaypalTransaction;
