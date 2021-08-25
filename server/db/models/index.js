const db = require("../db");

/***
 * I'm tracking aprox row counts as free heroku postgres has row limits
 * and yes I'm now storing who has made what confession for a bit (1 day) // TODO: make the delete hook preinstall itself
 * Its a good safety net to have considering the suicidal nature of some confessions...
 *
 * I figured out another method to get who had confessed something when I was asked by
 * the healthads to identify someone who had been posting suicidal confessions. They only
 * asked after a few hundred confessions had passed and the code took over a day to run
 * and find the person (There were multiple suicidal confessions to check, and it's bruteforce
 * limited by telegram's bot message sending limit so)
 *
 * So just in case I need to find a person quickly due to a concerning confession we
 * are logging all users. We dont need any more dabney suicides...
 */

const User = require("./user");
const Content = require("./content");

Content.belongsTo(User);

module.exports = {
  User,
  Content,
};
