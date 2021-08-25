const { Content } = require("../../../db/models");
const { butt, ik } = require("../helpers");
const { Menu } = require("./menu_class");

const describe = new Menu(async (from, args) => {
  const cont = await Content.findByPk(args.user.state);
  const text = `<b>How would you like to describe this content?</b> \n\nSimply using keywords will work well. \n\nThe currently detected text (not including descriptions added by others) is: \n\n${cont.description.text}`;
  const options = {
    ...ik([[butt("Cancel", "user_state=-1&delete=true")]]),
  };
  return { text, options };
}, "describe");

const exists = new Menu(async (from, args) => {
  return {
    text: `<b>This ${args.type} has already been cataloged...</b>\n\n View it or add a description to it with the buttons below.`,
    options: {
      ...ik([
        [butt("Add Description", `user_state=${args.exists}`)],
        [
          butt(
            "View",
            null,
            (options = {
              switch_inline_query_current_chat: `-i ${args.exists}`,
            })
          ),
        ],
      ]),
    },
  };
}, "exists");

const content_error = new Menu(async (from, args) => {
  return {
    text: `<b>There was an error adding your description:</b>\n\n ${
      error.type == 1
        ? "Currently only text descriptions are allowed."
        : error.type == 2
        ? "The description was over the 200 char limit"
        : ""
    }\n\nIf you would like to cancel or try again with a different description please use the buttons below.`,
    options: {
      ...ik([
        [
          butt("Try Again", `delete=true`),
          butt("Cancel", "delete=true&user_state=-1"),
        ],
      ]),
    },
  };
}, "content_error");

const des_success = new Menu(async (from, args) => {
  return {
    text: `<b>Thank you for adding a description to this ${args.cont.type}!</b>`,
    options: {
      ...ik([[butt("ok", `delete=true`)]]),
    },
  };
}, "des_success");

module.exports = {
  describe, // describe the content
  exists, // content already exists
  content_error,
  des_success,
};
