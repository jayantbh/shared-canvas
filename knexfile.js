require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DB_URL,
    migrations: {
      directory: './db/migrations',
    },
    seeds: { directory: './db/seeds' },
  },

  testing: {
    client: 'pg',
    connection: process.env.DB_URL,
    migrations: {
      directory: './db/migrations',
    },
    seeds: { directory: './db/seeds' },
  },

  production: {
    client: 'pg',
    connection: process.env.DB_URL,
    migrations: {
      directory: './db/migrations',
    },
    seeds: { directory: './db/seeds' },
  },
};
