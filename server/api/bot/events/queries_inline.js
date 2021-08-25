const bot = require("../bot");

/*
buttons = [
  {
    type: "article",
    id: conf.num,
    title: `Claim ${conf.horny ? "Horny " : ""}Confession #${conf.num}`,
    description:
      "Selecting this will send a message via the bot to show you are the confessor.",
    input_message_content: {
      message_text: `<b>${usr.name} is ${
        conf.horny ? "Horny " : ""
      }Confessor #${conf.num}</b>`,
      parse_mode: "HTML",
    },
  },
];
*/

// TODO inline query flags
// -f         => show favorites
// -r         => show random
// -p         => show popular content
// -r         => show recently used content
// -i n       => show content where id = n
// -t <type>  => show content of that type

bot.on("inline_query", async (inline_query) => {
  // console.log("\nINLINE QUERY \n", inline_query);
  // TODO use verification middleware
  let verification_status = -1;
  let buttons;
  let options = { cache_time: 0 };

  if (verification_status == -1) {
    buttons = [];
    // bot.sendMessage(inline_query.from.id);
  } else if (true) {
  }

  await bot.answerInlineQuery(inline_query.id, buttons, options);
});
