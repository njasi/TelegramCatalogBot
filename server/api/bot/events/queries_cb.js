const bot = require("../bot");
const { params_from_string, butt } = require("../helpers");
const { MENUS, detectAndSwapMenu } = require("../menus/index");
const { User, Content } = require("../../../db/models");

/**
 * all the annoying callbacks
 */
bot.on("callback_query", async (query) => {
  const params = params_from_string(query.data);
  const chat_id = query.message.chat.id;
  const message_id = query.message.message_id;

  // admin only cb buttons
  if (params.rad == "true" && query.from.id == process.env.ADMIN_ID) {
    // admin force approval
    if (params.approve_id !== null) {
      const user = await User.findOne({
        where: { poll_id: query.message.poll.id },
      });
      user.verification_status = 4;
      user.poll_id = null;
      await user.save();
      bot.deleteMessage(chat_id, message_id);
      MENUS.verify_accept.send({ id: user.telegram_id });
    }
    return;
  }

  // deletes messages from the bot when a user taps the button
  if (params.delete) {
    bot.deleteMessage(
      chat_id,
      params.delete == "true" ? message_id : params.delete
    );
  }
  // remove content when user hits its cancel button
  if (params.remove) {
    Content.destroy({ where: { id: parseInt(params.remove) } });
  }

  // clear params and display to the main chat
  if (params.sdesc) {
    const cont = await Content.findByPk(params.sdesc);
    await cont.display(process.env.CATALOG_CHAT_ID);
    bot.editMessageReplyMarkup(
      {
        reply_markup: {
          inline_keyboard: [[]],
        },
      },
      {
        chat_id,
        message_id,
      }
    );
    await MENUS.cataloged.send(
      { id: query.message.chat.id },
      { ignore_user_id: true, cont }
    );
  }

  // update user status for reciving input
  // if (params.edit_item) {
  //   const user = await User.findOne({ where: { telegram_id: query.from.id } });
  //   user.state = `editing_${params.edit_item}`;
  //   user.save();
  // }

  if (params.user_state) {
    const user = await User.findOne({ where: { telegram_id: query.from.id } });
    if (!user) {
      await bot.answerCallbackQuery(query.id, {
        text: `Please /start @${process.env.BOT_USERNAME} first.`,
        show_alert: true,
      });
      return;
    } else if (user.state !== 0 && parseInt(params.user_state) !== 0) {
      await bot.answerCallbackQuery(query.id, {
        text:
          user.state == params.user_state
            ? "You appear to already be editing this content. Just sent the text you want!"
            : `You are already editing some content's description/ocr. Please cancel that action first. \n\n(/cancel or the cancel button)`,
        show_alert: true,
      });
      return;
    }
    user.state = params.user_state;
    await user.save();
    // 0 indicates idle
    if (params.user_state != 0) {
      const res = await MENUS.describe.send(
        { id: query.from.id },
        { id: params.user_state }
      );
      if (!res.ok) {
        if (res.no_init) {
          await bot.answerCallbackQuery(query.id, {
            text: `Please /start @${process.env.BOT_USERNAME} first.`,
            show_alert: true,
          });
          user.state = 0;
          await user.save();
          return;
        } else if (res.ok == false) {
          await bot.answerCallbackQuery(query.id, {
            text: "There was an error. /rip",
          });
          user.state = 0;
          await user.save();
          return;
        }
      }
    }
  }

  /**
   * cancel everything
   */
  if (params.call == "true") {
    const user = await User.findOne({ where: { telegram_id: query.from.id } });
    user.state = 0;
    await user.save();
    await bot.answerCallbackQuery(query.id, {
      text: "Your current actions were canceled!",
      show_alert: true,
    });
    await bot.deleteMessage(user.telegram_id, message_id);
  } else if (params.call == "false") {
    await bot.answerCallbackQuery(query.id, {
      text: "Ok your actions were not canceled.",
      show_alert: true,
    });
    await bot.deleteMessage(query.from.id, message_id);
  }

  // swaps to a new menu if the menu key is in params
  detectAndSwapMenu(query, params, bot);
});
