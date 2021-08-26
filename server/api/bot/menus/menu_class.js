const User = require("../../../db/models/user");
const { ik, butt } = require("../helpers");
const bot = require("../bot");

// TODO refator this

/**
 * the general Menu class so i dont have to replicate a lot of code.
 */
class Menu {
  constructor(get_data, key) {
    this.get_data = get_data;
    this.key = key;
  }
  /**
   * run the get data function with whatever args are given to load
   * @returns promise, object with .text and .options needed to send a menu
   */
  async load() {
    return await this.get_data(...arguments);
  }

  async send(from, options) {
    try {
      let data;
      // a lot of menus need the user so
      const user = await User.findOne({ where: { telegram_id: from.id } });
      if (user != null || from.ignore_user_id) {
        data = await this.load(
          from,
          { ...options, bot: bot, user: user },
          ...Array.prototype.slice.call(arguments, [3])
        );
      } else {
        data = { text: "Please send /start first", options: {} };
      }
      const res = await bot.sendMessage(from.id, data.text, {
        parse_mode: "HTML",
        ...data.options,
      });
      if (user && !from.ignore_user_id) {
        user.misc = { ...user.misc, menu_id: res.message_id };
        await user.save();
      }
      return res;
    } catch (error) {
      bot.sendMessage(
        process.env.ADMIN_ID,
        `There was an error in the ${this.key} menu:\n${error.stack}`
      );
      return {
        ok: false,
        error,
        no_init:
          error.message ==
          "ETELEGRAM: 403 Forbidden: bot can't initiate conversation with a user",
      };
    }
  }
}

module.exports = { Menu };
