import Sequelize from 'sequelize'
import Recording from './Recording.js'
import RecordingHit from './RecordingHit.js'
import Historylist from './Historylist.js'
import Event from './Event.js'
import UserProfile from './UserProfile.js'
import PaypalTransaction from './PaypalTransaction.js'
import sequelize from './sequelize.js'

const db = {};

db.getPagination = (page, size) => {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};
db.getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, items, totalPages, currentPage };
};


db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Recording = Recording;
db.RecordingHit = RecordingHit;
db.Historylist = Historylist;
db.UserProfile = UserProfile;
db.PaypalTransaction = PaypalTransaction;
db.Event = Event;


export default db;