const bot = require("../bot");
const {
  parse_flags,
  flag_to_options,
  remove_flags,
  create_query,
} = require("../config/flags");
const { verifyUser } = require("./middleware");
const util = require("util");
const { Content } = require("../../../db/models");

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
// -n         => show recently used content
// -i n       => show content where id = n
// -u user    => show content from this user
// -t type    => show content of that type

bot.on("inline_query", async (inline_query) => {
  // console.log("\nINLINE QUERY \n", inline_query);
  // TODO use verification middleware
  let buttons = [];
  let options = {
    cache_time: 0,
    switch_pm_text: "Catalog Content",
    switch_pm_parameter: "catalog",
  };
  v_status = await verifyUser(inline_query.from.id);

  console.log("\nINLINE QUERY:\n", inline_query.query);
  if (!v_status) {
    console.log("Not verified");
    buttons = [];
    options.switch_pm_text = "Please Verify First";
    options.switch_pm_parameter = "verify";
    // bot.sendMessage(inline_query.from.id);
  } else {
    query_options = await create_query(inline_query.query);
    const content = await Content.findAll(query_options);
    buttons = content.map((c) => c.to_inline_button());
    console.log("\nBUTTONS:\n", buttons);
  }

  console.log("\nOPTIONS\n",options);
  await bot.answerInlineQuery(inline_query.id, buttons, options);
});
