const {
  ON_UPDATE_TIMESTAMP_FUNCTION,
  DROP_ON_UPDATE_TIMESTAMP_FUNCTION,
} = require('../triggers/update_timestamp');

exports.up = function (knex) {
  return knex.raw(ON_UPDATE_TIMESTAMP_FUNCTION);
};

exports.down = function (knex) {
  return knex.raw(DROP_ON_UPDATE_TIMESTAMP_FUNCTION);
};
