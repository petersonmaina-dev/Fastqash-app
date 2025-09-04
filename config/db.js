const { Sequelize } = require("sequelize");
require("dotenv").config();  // <-- add this line

const sequelize = new Sequelize(
  process.env.MYSQL_DB,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    logging: false, // set true if you want SQL logs
  }
);

module.exports = sequelize;
