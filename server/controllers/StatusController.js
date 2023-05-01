import db from "../models/db.js";
const Historylist = db.Historylist;

export default {
  index: (req, res) => {
    Historylist.findAll({ limit: 1, order: [['id', 'DESC']] })
    .then(data => {
      res.send(data?.[0] ?? null);
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