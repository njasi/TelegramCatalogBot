const { butt, ik } = require("../helpers");
const { Menu } = require("./menu_class");

// TODO: cancel, delete=true btns on this screen will remove the message but not a confession if there is one.

const settings = new Menu(() => {
  const text = "<b>Settings</b>\n\nSettings are still a work in progress.";
  const options = {
    ...ik([[butt("Back", "menu=start")]]),
  };
  return { text, options };
}, "settings");

const favorites = new Menu(() => {
  const text =
    "<b>Favorites</b>\n\nAt a later date you will be able to favorite content for quick recall";
  const options = {
    ...ik([[butt("Back", "menu=start")]]),
  };
  return { text, options };
}, "favorites");

module.exports = {
  settings, // main settings menu
};
