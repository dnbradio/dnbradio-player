import db from "../models/db.js";
import { Op } from 'sequelize';
const Event = db.Event;

export default {
  findAll: (req, res) => {
    Event.findAll({ where: { tzRegion: { [Op.not]: null } }, limit: 900, order: [['id', 'DESC']] })
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