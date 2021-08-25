const Sequelize = require("sequelize");

const databaseName = "catalog_bot";

let options = {
  logging: (query) => {
    // console.log("\n", query, "\n");
  },
};

if (process.env.NODE_ENV == "production") {
  options = {
    ...options,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  };
}

const db = new Sequelize(
  process.env.DATABASE_URL || `postgres://localhost:5432/${databaseName}`,
  options
);

module.exports = db;
