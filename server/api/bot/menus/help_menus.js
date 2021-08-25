const { butt, ik } = require("../helpers");
const { Menu } = require("./menu_class");

// TODO: cancel, delete=true btns on this screen will remove the message but not a confession if there is one.

const help = new Menu(() => {
  const text =
    "<b>To search for content:</b>\nblah blah\n\n<b>To Catalog Contnt<\b>";
  const options = {
    ...ik([
      [butt("Commands", "menu=commands"), butt("About", "menu=about")],
      [
        butt("Fellowdarbs info", "menu=fellows_info"),
        butt("Confessions Network™ info", "menu=network_info"),
      ],
      [butt("Main menu", "menu=start")],
    ]),
  };
  return { text, options };
});

const about = new Menu(() => {
  const text =
    "// TODO: put meaningful text here... just ask others what this is about for now";
  const options = {
    ...ik([[butt("Help Menu", "menu=help"), butt("Cancel", "delete=true")]]),
  };
  return { text, options };
});

const commands = new Menu(() => {
  const text =
    "<b>Commands:</b> \n/start, /menu, /fellows\nBring up the default non confession menu.\n/poll\nSend an anon poll to the confessions chats. ";
  const options = {
    ...ik([[butt("Help Menu", "menu=help"), butt("Cancel", "delete=true")]]),
  };
  return { text, options };
});

module.exports = {
  help, // main help menu
  about, // about
  commands, // list of commands
};
