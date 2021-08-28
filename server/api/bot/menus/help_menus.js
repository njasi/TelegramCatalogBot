const { butt, ik } = require("../helpers");
const { Menu } = require("./menu_class");

// TODO: cancel, delete=true btns on this screen will remove the message but not a confession if there is one.

const help = new Menu(() => {
  const text = `<b>To search for content:</b>\ntype @${process.env.BOT_USERNAME} [search] \nResults will then appear above your keyboard. \nFor more advanced searches there are some optional flags. Select the "Flags" button to learn more.\n\n<b>To Catalog Content:</b>\nSend me a sticker or forward me a message and I will catalog it for you. This also works if a forward is sent to the Powerful Forwards chat or a sticker is sent to the Looking for Sticker chat.`;
  const options = {
    ...ik([
      [butt("Commands", "menu=commands"), butt("Flags", "menu=flags")],
      [butt("About", "menu=about"), butt("Main menu", "menu=start")],
    ]),
  };
  return { text, options };
}, "help");

const about = new Menu(() => {
  const text = `I wanted quick access to forwards and sticker so I made this...\n\nTech used:\nnodejs, Postgresssql, Tesseract, Puppeteer\n\nThe bot is currently maintained by ${process.env.ADMIN_NAME} (@${process.env.ADMIN_USERNAME})`;
  const options = {
    ...ik([[butt("Help Menu", "menu=help"), butt("Cancel", "delete=true")]]),
  };
  return { text, options };
}, "about");

const commands = new Menu(() => {
  const text =
    "<b>Commands:</b> \n/start, /menu:\nBring up the default menu.\n\n/cancel:\nCancel your current action";
  const options = {
    ...ik([[butt("Help Menu", "menu=help"), butt("Cancel", "delete=true")]]),
  };
  return { text, options };
}, "commands");

const flags = new Menu(() => {
  const text = `<b>Flags:</b><code>
<b>-f </b>        show your favorites
<b>-r </b>        show a random result
<b>-p </b>        show popular content
<b>-n </b>        show recently used content
<b>-i n   </b>    show content where id = n
<b>-u name</b>    show content from this user/stickerpack
<b>-t type</b>    show content of that type (sticker|forward)</code>
\n<b>Examples:</b>
@${process.env.BOT_USERNAME} -n -t sticker
    returns recently used stickers
@${process.env.BOT_USERNAME} -r -u nj
    gives a random result from a user/stickerpack with nj in their name
@${process.env.BOT_USERNAME} benson -p
    shows content that matches the query 'benson' in order of popularity

Flags and search terms can be used in any combination.
`;
  const options = {
    ...ik([
      [butt("Help Menu", "menu=help"), butt("Cancel", "delete=true")],
      [
        butt("Ex 1", null, {
          switch_inline_query_current_chat: "-n -t sticker",
        }),
        butt("Ex 2", null, {
          switch_inline_query_current_chat: "-r -u nj",
        }),
        butt("Ex 3", null, {
          switch_inline_query_current_chat: "benson -p",
        }),
      ],
    ]),
  };
  return { text, options };
}, "flags");

module.exports = {
  help, // main help menu
  about, // about
  commands, // list of commands
  flags, // info on flags
};
