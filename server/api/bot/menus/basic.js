const { ik, butt } = require("../helpers");
// const { User, Confession } = require("../../../db/models");
const { Menu } = require("./menu_class");

const start = new Menu(async () => {
  return {
    text: "Boi",
    options: {
      ...ik([
        [
          butt("Favorites", "menu=favorites"),
          butt("Settings", "menu=settings"),
        ],
        [butt("Help", "menu=help"), butt("About", "menu=about")],
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
});

module.exports = {
  start, // the start menu
  cancel, // cancel everything
};
