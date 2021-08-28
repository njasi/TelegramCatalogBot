const Sequelize = require("sequelize");
const db = require("../db");

const User = db.define("user", {
  /**
   * their telegram id
   */
  telegram_id: {
    type: Sequelize.INTEGER,
    unique: true,
  },
  /**
   * messy but there's no reason to make it complicated
   * n < 0 state => editing escription of content {where content.id = -1*n}
   * 0 state = not editing description
   * n > 0 state => editing description of content {where content.id = n}
   */
  state: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  /**
   * misc data so i dont have to add more cols later lol
   */
  misc: {
    type: Sequelize.JSON,
    defaultValue: { favorites: {} },
  },
});

module.exports = User;
