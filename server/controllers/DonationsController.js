import moment from "moment";
import db from "../models/db.js";
const PaypalTransaction = db.PaypalTransaction;
const { Op } = require("sequelize");
export default {
  index: (req, res) => {
    PaypalTransaction.findAll({ 
      limit: 50,
      where: { date: { [Op.gt]: moment().subtract(35, 'day').toISOString().substring(0,10) } }, 
      order: [['gross', 'DESC']] })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      if (!res.status) { console.error(err); return; }

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving records."
      });
    });
  }
}