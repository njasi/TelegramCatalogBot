const { ik, butt } = require("../helpers");
// const { User, Confession } = require("../../../db/models");
const { Menu } = require("./menu_class");

const start = new Menu(async () => {
  return {
    text: `<b>Use the buttons below to navigate the menus</b>\n\nIf you want to send some content to a chat select "Search".\n\nFor more info on how to use the bot select "Help"`,
    options: {
      ...ik([
        [
          butt("Settings", "menu=settings"),
          butt("Search", null, {
            switch_inline_query: "",
          }),
        ],
        [butt("Help", "menu=help"), butt("Close", "delete=true")],
      ]),
    },
  };
}, "start");

const cancel = new Menu(async (from, args) => {
  const text = "Cancel everything you are currently doing?";
  const options = {
    ...ik([[butt("Yes", "call=true"), butt("No", "call=false")]]),
  };
  return { text, options };
}, "cancel");

module.exports = {
  start, // the start menu
  cancel, // cancel everything
};
