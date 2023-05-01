import db from "../models/db.js";

const Recording = db.Recording;
const RecordingHit = db.RecordingHit;
const Op = db.Sequelize.Op;

export default {
  create: (req, res) => {
    // Validate request
    if (!req.body.title) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      return;
    }
    // Create a record
    const record = {
      title: req.body.title,
      description: req.body.description,
      published: req.body.published ? req.body.published : false
    };
    // Save record in the database
    Recording.create(record)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the record."
        });
      });
  },
  findAll: (req, res) => {
    const { page, size, title, orderBy } = req.query;
    const { limit, offset } = db.getPagination(page, size);
    var condition = title ? { title: { [Op.like]: `%${title}%` } } : null;
    var order = orderBy || [['id', 'DESC']];
    Recording.findAndCountAll({ limit, offset, where: condition, order })
      .then(data => {
        const response = db.getPagingData(data, page, limit);
        res.send(response);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving records."
        });
      });
  },
  findOne: (req, res) => {
    const id = req.params.id;
    Recording.findByPk(id)
      .then(data => {
        if (data) {
          res.send(data);
        } else {
          res.status(404).send({
            message: `Cannot find record with id=${id}.`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving record with id=" + id
        });
      });
  },
  update: (req, res) => {
    const id = req.params.id;
    Recording.update(req.body, {
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Record was updated successfully."
          });
        } else {
          res.send({
            message: `Cannot update record with id=${id}. Maybe record was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating record with id=" + id
        });
      });
  },
  delete: (req, res) => {
    const id = req.params.id;
    Recording.destroy({
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Record was deleted successfully!"
          });
        } else {
          res.send({
            message: `Cannot delete record with id=${id}. Maybe record was not found!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Could not delete record with id=" + id
        });
      });
  },
  deleteAll: (req, res) => {
    Recording.destroy({
      where: {},
      truncate: false
    })
      .then(nums => {
        res.send({ message: `${nums} records were deleted successfully!` });
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while removing all records."
        });
      });
  }
}