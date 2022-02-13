const { TRIGGER } = require('../triggers/update_timestamp');

exports.up = (knex) => knex.schema
  .createTable('canvas_entries', (t) => {
    t.uuid('uuid').defaultTo(knex.raw('gen_random_uuid()')).primary();
    t.uuid('user_uuid');
    t.uuid('room_uuid');
    t.unique(['user_uuid', 'room_uuid']);
    t.binary('image');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  })
  .then(() => knex.raw(TRIGGER('canvas_entries')));

exports.down = (knex) => knex.schema.dropTableIfExists('canvas_entries');
