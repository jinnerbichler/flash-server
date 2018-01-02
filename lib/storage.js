const dirty = require('dirty');
const db = dirty('flash.db');

function get(key) {
  return db.get(key);
}

function set(key, obj) {
  db.set(key, obj);
}

module.exports = {
  'get': get,
  'set': set
};