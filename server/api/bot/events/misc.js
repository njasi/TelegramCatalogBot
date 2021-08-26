/**
 * misc messages that occur like
 *  chat migrations, polling error, etc
 */

const bot = require("../bot");

/**
 * alert admin of webhook error
 */
bot.on("webhook_error", (error) => {
  bot.sendMessage(
    process.env.ADMIN_ID,
    `There was a webhook error:\n${error.trace}`
  );
  console.error(`There was a webhook error:\n${error.trace}`);
});

/**
 * alert admin of polling error
 */
bot.on("polling_error", (err) => {
  bot.sendMessage(
    process.env.ADMIN_ID,
    `There was a polling error:\n${err.trace}`
  );
  console.error(`There was a polling error:\n${err.trace}`);
});

/**
 * let me know if a chat migrates
 */
bot.on("migrate_to_chat_id", async (message) => {
  bot.sendMessage(
    process.env.ADMIN_ID,
    `Migrate To:\n${JSON.stringify(message)}`
  );
});
