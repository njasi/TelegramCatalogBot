const bot = require("../bot");

/*
 *  This whole setup can be improved a lot, so do that if you'd like.
 */

/**
 *
 */
const menu_type_switch = async (data) => {
  if (data.send_image) {
    // switch into a menu with an image, note the text limit (1024 char) change somewhere (from 4096)
    await bot.deleteMessage(query.message.chat.id, query.message.message_id);
    const message = await bot.sendPhoto(
      query.message.chat.id,
      data.send_image,
      {
        caption: data.text,
        parse_mode: "HTML",
        ...data.options,
      }
    );
    return message;
  } else if (!query.message.text) {
    // switching away from a media menu
    try {
      await bot.deleteMessage(query.message.chat.id, query.message.message_id);
    } catch (error) {
      // do nothing, some menus delete themselves. I'm too lazy to make this clean srry
      // TODO: fix the media menus that delete themselves
    }
    const message = await bot.sendMessage(query.message.chat.id, data.text, {
      parse_mode: "HTML",
      ...data.options,
    });
    return message;
  } else {
    const message = await bot.editMessageText(data.text, {
      message_id: query.message.message_id,
      chat_id: query.message.chat.id,
      parse_mode: "HTML",
      ...data.options,
    });
    return message;
  }
};

/**
 * The function that dynamicly swaps menus based on queries and the user
 */
async function swapMenu(query, params) {
  try {
    const menu = MENUS[params.menu];
    const data = await menu.load(query.from, {
      ...params,
      query,
      from_swap: true,
    });

    const message = await menu_type_switch(data);
    // TODO deal with the message
  } catch (error) {
    // TODO make more standard error handling
    bot.sendMessage(
      process.env.ADMIN_ID,
      `There was an error swapping into the ${params.menu} menu:`
    );
    bot.sendMessage(process.env.ADMIN_ID, `${error.stack}`); // seperate messages in case the stack is so long that it stops the warning.
  }
}

/**
 * detects if a query has a menu tag and swaps to it if there is
 *
 * returns true if a swap occurs, false otherwise
 */
async function detectAndSwapMenu(query, params, bot) {
  if (query.data.match(/^menu=/)) {
    swapMenu(query, params, bot);
    return true;
  }
  return false;
}


const MENUS = {
  ...require("./content"),
  ...require("./basic"),
  ...require("./help_menus"),
  ...require("./settings"),
};

module.exports = { MENUS, detectAndSwapMenu, swapMenu };
