/**
 * file to deal with the general messages the bot sees, ie anything that is not a callback or a query
 * basically just messages sent by a user
 */

const bot = require("../bot");
const { isDm, ik, butt } = require("../helpers");
const { MENUS, swapMenu } = require("../menus/index");
const { User, Content } = require("../../../db/models");
const { vMid } = require("./middleware");

/**
 * seperate .on message used to log messages
 */
// bot.on("message", async (message) => {
//   console.log("\n\nMESSAGE:\n\n", message);
// });

// TODO: revaluate to setup that doesnt detect so theres less uptime

/**
 * checks if a forward is sent and adds it to the archive if it's a new one
 */
// TODO: detect forwards to the powerful forwards chat
bot.on(
  "message",
  vMid(async (message, meta) => {
    if (
      (`${message.chat.id}` == process.env.POWERFUL_FORWARDS_CHAT_ID ||
        isDm(message)) &&
      !!message.forward_from
    ) {
      const response = await bot.sendMessage(
        message.chat.id,
        `<b>Parsing Forward...</b>`,
        { parse_mode: "HTML" }
      );

      const cont = await Content.addForward(message);
      await bot.deleteMessage(response.chat.id, response.message_id);
      if (cont.exists) {
        await bot.sendMessage(
          message.chat.id,
          "<b>This forward has already been cataloged...</b>\n\n View it or add a description to it with the buttons below.",
          {
            parse_mode: "HTML",
            ...ik([
              [butt("Add Description", `user_state=${cont.exists}`)],
              [
                butt(
                  "View",
                  null,
                  (options = {
                    switch_inline_query_current_chat: `-i ${cont.exists}`,
                  })
                ),
              ],
            ]),
          }
        );
      } else {
        await cont.display(message.chat.id, (confirm = true));
      }
    }
  }, (skip_on_command = true))
);

// TODO: detect stickers sent to the find stickers chat
bot.on(
  "message",
  vMid(async (message, meta) => {
    if (`${message.chat.id}` == process.env.LOOKING_FOR_STICKER_CHAT_ID) {
      Content.addSticker(message);
    }
  }, (skip_on_command = true))
);

// TODO: detect editing description
bot.on(
  "message",
  vMid(async (message, meta) => {
    if (isDm(message) && meta == "text") {
      // Todo edit
    }
  }, (skip_on_command = true))
);
