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
      console.log(message.message_id);
      console.log(response.message_id);
      if (cont.exists) {
        await MENUS.exists.send(
          { id: message.chat.id, ignore_user_id: true },
          {
            type: "forward",
            exists: cont.exists,
            message_id: message.message_id,
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
    if (isDm(message)) {
      const user = await User.findOne({
        where: { telegram_id: message.from.id },
      });
      if (user.state <= 0) {
        return;
      }
      // is a dm adding description
      if (meta.type == "text") {
        // content is text message
        if (message.text.length > 200) {
          await MENUS.content_error.send({ ...message.from }, { error: 2 });
          return;
        }
        const cont = await Content.findByPk(user.state);
        cont.description = { ...cont.description, [user.id]: message.text };
        user.state = -1;
        await cont.save();
        await user.save();

        console.log(user.misc, user.id);
        console.log(message.chat.id, user.misc.menu_id);
        await bot.deleteMessage(message.chat.id, user.misc.menu_id);
        await MENUS.des_success.send({ ...message.from }, { cont });
      } else {
        // content not text message
        await bot.deleteMessage(message.chat.id, message.message_id);
        await MENUS.content_error.send({ ...message.from }, { error: 1 });
      }
    }
  }, (skip_on_command = true))
);
