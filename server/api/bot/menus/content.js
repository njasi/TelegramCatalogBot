const { Content } = require("../../../db/models");
const { butt, ik } = require("../helpers");
const { Menu } = require("./menu_class");

const describe = new Menu(async (from, args) => {
  const cont = await Content.findByPk(args.user.state);
  if (cont == null) {
    return {
      text: "It seems that this content no longer exists. /f",
      options: { ...ik([[butt("Ok", "delete=true")]]) },
    };
  }
  const text = `<b>How would you like to describe this content?</b>\nSimply using keywords will work well. \n\nThe currently detected text (not including descriptions added by others) is: \n\n${cont.description.text}`;
  const options = {
    ...ik([[butt("Cancel", "user_state=0&delete=true")]]),
  };
  return { text, options };
}, "describe");

const exists = new Menu(async (from, args) => {
  return {
    text: `<b>This ${args.type} has already been cataloged...</b>\n\nView it or add a description to it with the buttons below.`,
    options: {
      ...ik([
        [
          butt("Add Description", `user_state=${args.exists}`),
          butt(
            "View",
            null,
            (options = {
              switch_inline_query_current_chat: `-i ${args.exists}`,
            })
          ),
        ],
        [butt("Close", "delete=true")],
      ]),
      reply_to_message_id: args.message_id,
    },
  };
}, "exists");

const content_error = new Menu(async (from, args) => {
  return {
    text: `<b>There was an error adding your description:</b>\n\n${
      args.error == 1
        ? "Currently only text descriptions are allowed."
        : args.error == 2
        ? "The description was over the 200 char limit"
        : args.error == 3
        ? "The content no longer exists somehow... Please use the cancel button below."
        : "Unknown error lol"
    }\n\nIf you would like to cancel or try again with a different description please use the buttons below.`,
    options: {
      ...ik([
        [
          butt("Try Again", `delete=true`),
          butt("Cancel", "delete=true&user_state=0"),
        ],
      ]),
    },
  };
}, "content_error");

const des_success = new Menu(async (from, args) => {
  return {
    text: `<b>Thank you for ${
      args.ocr ? "editing the ocr text for" : "adding a decscription to"
    } this ${args.cont.type}!</b>`,
    options: {
      ...ik([[butt("Close", `delete=true`)]]),
    },
  };
}, "des_success");

const cataloged = new Menu(async (from, args) => {
  return {
    text: `<b>Your Content Was Cataloged!</b>\n\n${
      args.cont.type == "sticker"
        ? args.cont.description.text.trim.length == 0
          ? "No text was detected in this sticker. Please select edit OCR to give it a title.\n\n"
          : `The following text was detected with OCR:\n${args.cont.description.text}\n\n`
        : ""
    }You can add a description ${
      args.cont.type == "sticker" ? "or edit the OCR text " : ""
    }to it using the button${args.cont.type == "sticker" ? "s" : ""} below.`,
    options: {
      ...ik([
        [
          butt("Add Description", `user_state=${args.cont.id}`),
          butt("Edit OCR", `user_state=${args.cont.id}`),
        ],
      ]),
    },
  };
});

module.exports = {
  describe, // describe the content
  exists, // content already exists
  content_error, // error with content
  des_success, // success adding description
  cataloged, // notif/menu after cataloged content
};
