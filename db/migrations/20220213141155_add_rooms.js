const { TRIGGER } = require('../triggers/update_timestamp');

exports.up = async function (knex) {
  await knex.schema
    .createTable('drawing_rooms', (t) => {
      t.uuid('uuid').defaultTo(knex.raw('gen_random_uuid()')).primary();
      t.string('name', 80);
      t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    }).then(() => knex.raw(TRIGGER('drawing_rooms')));

  await knex.schema.createTable('users', (t) => {
    t.uuid('uuid').defaultTo(knex.raw('gen_random_uuid()')).primary();
    t.string('name', 80);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  }).then(() => knex.raw(TRIGGER('users')));

  await knex.schema.alterTable('canvas_entries', (t) => {
    t.foreign('room_uuid').references('drawing_rooms.uuid').onDelete('CASCADE');
  });

  await knex.schema.alterTable('canvas_entries', (t) => {
    t.foreign('user_uuid').references('users.uuid').onDelete('CASCADE');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('canvas_entries', (t) => {
    t.dropForeign('room_uuid');
    t.dropForeign('user_uuid');
  });

  await knex.schema.dropTableIfExists('drawing_rooms');
  await knex.schema.dropTableIfExists('users');
};
