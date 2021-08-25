const { butt, ik } = require("../helpers");
const { Menu } = require("./menu_class");

// TODO: cancel, delete=true btns on this screen will remove the message but not a confession if there is one.

const settings = new Menu(() => {
  const text = "<b>Boi:</b>\nblah blah";
  const options = {
    ...ik([[butt("Back", "menu=start")]]),
  };
  return { text, options };
});

module.exports = {
  settings, // main settings menu
};
