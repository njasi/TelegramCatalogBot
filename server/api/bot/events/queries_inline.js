const bot = require("../bot");
const { create_query } = require("../config/flags");
const { verifyUser } = require("./middleware");
const { Content } = require("../../../db/models");

bot.on("inline_query", async (inline_query) => {
  let buttons = [];
  let options = {
    cache_time: 0,
    switch_pm_text: "Catalog More Content",
    switch_pm_parameter: "catalog",
  };
  v_status = await verifyUser(inline_query.from.id);

  if (!v_status) {
    buttons = [];
    options.switch_pm_text = "Please Verify First";
    options.switch_pm_parameter = "verify";
  } else {
    query_options = await create_query(inline_query.query);
    let content = [];
    try {
      content = await Content.findAll({ limit: 50, ...query_options });
    } catch (error) {}
    buttons = content.map((c) => c.to_inline_button());
    if (buttons.length == 0) {
      options.switch_pm_text = "Catalog What You're Missing";
      options.switch_pm_parameter = "catalog";
    }
  }

  await bot.answerInlineQuery(inline_query.id, buttons, options);
});

bot.on("chosen_inline_result", async (result) => {
  const cont = await Content.findByPk(result.result_id);
  cont.uses++;
  cont.save();
});
