const bot = require("../bot");
const { commandRegexDict } = require("../config/command_regexes");
const { MENUS } = require("../menus/index");
const { Chat } = require("../../../db/models");
const {
  cvMid,
} = require("./middleware");

// TODO update the menu.send method so i dont need to pass the bot
// might be pain sinces the menus are all made

/**
 * send start menu
 */
bot.onText(commandRegexDict.start, (message, reg) => {
  cvMid((message) => {
    MENUS.start.send(message.from, { fc: true });
  })(message, reg);
});

/**
 * Send cancel menu
 */
bot.onText(
  commandRegexDict.cancel,
  cvMid((message) => {
    MENUS.cancel.send(message.from, {
      fc: true,
      command: "cancel",
    });
  })
);

/**
 * send Help menu
 */
bot.onText(
  commandRegexDict.help,
  cvMid((message) => {
    MENUS.help.send(message.from, { fc: true });
  })
);

/**
 * send About menu
 */
bot.onText(
  commandRegexDict.about,
  cvMid((message) => {
    MENUS.about.send(message.from, { fc: true });
  })
);
