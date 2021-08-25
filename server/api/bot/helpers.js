/**
 * Checks if a message is a dm to the bot
 * @param {TelegramBot.message} message - message the bot will be checking
 * @returns {boolean}
 */
function isDm(message) {
  try {
    return (
      message.from.id == message.chat.id &&
      message.chat.type !== "group" &&
      message.chat.type !== "supergroup"
    );
  } catch (error) {
    return false;
  }
}

/**
 * returns the full name of a user plus their username if they have one
 * @param {Telegram.user} user
 */
function getFullName(user, username = true) {
  let first,
    last = "",
    un = "";
  if (user.first_name) {
    first = user.first_name;
  }
  if (user.last_name) {
    last = ` ${user.last_name}`;
  }
  if (username && user.username) {
    un = ` (@${user.username})`;
  }
  return first + last + un;
}

/**
 * parses the paramaters i have stored in a callback query into an object. This is technically an unsafe operation...
 * datastring is in a format of key=value&key1=value1&...
 * limit 64 bytes
 * @param {string} str: callback query data
 * @returns an object with the keys and their values
 */
function params_from_string(str) {
  let splt = str.split("&");
  const params = {};
  for (let i = 0; i < splt.length; i++) {
    const p = splt[i].split("=");
    params[p[0]] = p[1];
  }
  return params;
}

/**
 * haha butt
 * returns a formatted button for me so I can be lazy
 * @param {string} text - button text
 * @param {string} callback_data - button cb data
 * @param {object} options - options to use instead of cbdata
 */
function butt(text, callback_data, options = null) {
  if (options != null) {
    return { text, ...options };
  }
  return { text, callback_data };
}

/**
 * amother formatted thing to be lazy
 * @param {array of array of object} buttons - buttons
 */
function ik(buttons) {
  return { reply_markup: { inline_keyboard: buttons } };
}

module.exports = {
  isDm,
  getFullName,
  params_from_string,
  butt,
  ik,
};
