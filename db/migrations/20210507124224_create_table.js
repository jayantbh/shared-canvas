const updateTimestampTrigger = require("../triggers/update_timestamp");

exports.up = (knex) =>
  knex.schema
    .createTable("canvas_entries", (t) => {
      t.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));
      t.string("username", 80);
      t.binary("image");
      t.specificType("ip", "inet");
      t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
      t.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    })
    .then(() => updateTimestampTrigger("canvas_entries"));

exports.down = (knex) => knex.schema.dropTableIfExists("canvas_entries");
