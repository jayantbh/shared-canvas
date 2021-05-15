const ON_UPDATE_TIMESTAMP_FUNCTION = `
  CREATE OR REPLACE FUNCTION on_update_timestamp()
  RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
$$ language 'plpgsql';
`;

const DROP_ON_UPDATE_TIMESTAMP_FUNCTION = `
  DROP FUNCTION IF EXISTS on_update_timestamp() CASCADE;
`;

module.exports = {
  TRIGGER: (table) => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON ${table}
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `,
  ON_UPDATE_TIMESTAMP_FUNCTION,
  DROP_ON_UPDATE_TIMESTAMP_FUNCTION,
};
