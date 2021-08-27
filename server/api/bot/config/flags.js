const { Op, Sequelize } = require("sequelize");
const db = require("../../../db");
/**
 * A regex containing all of the regex flags generated above.
 */
const allFlags = /-(([tui] )([^ -]+)|([nprf]))( |$)/gi;

/**
 * parses text and returns flags along with any of their values
 * @param {string} text
 * @returns object {flag:}
 */
function parse_flags(text) {
  const matches = text.match(allFlags);
  if (!matches) {
    return {};
  }
  return matches.map((flag) => {
    return flag.match(/[^- ]+/g);
  });
}

/**
 * removes all flags from text
 * @param {string} text
 * @returns string
 */
function remove_flags(text) {
  return text.replace(allFlags, "");
}

// -f         => show favorites
// -r         => show random
// -p         => show popular content
// -n         => show recently used content
// -i n       => show content where id = n
// -u user    => show content from this user
// -t type    => show content of that type

function flag_to_options(flag, user) {
  const arg = flag[1];
  switch (flag[0]) {
    case "r": {
      return { order: Sequelize.literal("random()") };
    }
    case "f": {
      if (misc.user.favorites) {
        return {
          and: {
            [Op.or]: misc.user.favorites.map((fav) => ({ id: fav })),
          },
        };
      } else {
        return {};
      }
    }
    case "p": {
      return {
        order: ["uses", "DESC"],
      };
    }
    case "n": {
      return {
        order: ["updatedAt", "DESC"],
      };
    }
    case "i": {
      if (parseInt(arg)) {
        return {
          or: { id: parseInt(arg) },
        };
      } else {
        return {};
      }
    }
    case "u": {
      return {
        and: { description: { name: { [Op.iLike]: "%" + arg + "%" } } },
      };
    }
    case "t": {
      return { and: { type: arg } };
    }
  }
}

/**
 * messy but gets the job done... kinda
 * @param {string query} query
 * @returns options object for sequlize query
 */
async function create_query(query) {
  const dict = { or: Op.or, and: Op.and };

  const flags = parse_flags(query);
  const text = remove_flags(query);

  let options = { where: {} };
  for (let i = 0; i < flags.length; i++) {
    const f_op = flag_to_options(flags[i], v_status.user);
    const key = Object.keys(f_op)[0];
    if (key == "and" || key == "or") {
      if (options.where[dict[key]]) {
        options.where[dict[key]].push(f_op[key]);
      } else {
        options.where[dict[key]] = [f_op[key]];
      }
    } else if (key == "order") {
      if (options[key]) {
        options[key].push(f_op[key]);
      } else {
        options[key] = [f_op[key]];
      }
    }
  }
  if (text) {
    if (!options.where[Op.or]) {
      options.where[Op.or] = [];
    }

    let term = `%${text.replace(/ /g, "%")}%`;
    options.where[Op.or].push({
      description: { text: { [Op.iLike]: term } },
    });

    const results = await db.query(`
      WITH term_list (id,term) as
        (
        SELECT id, (json_array_elements_text(contents.description ::json->'user')) as term
        FROM contents
        )
      SELECT DISTINCT id
      FROM term_list
      WHERE term ILIKE '${term}'
      ;`);
    options.where[Op.or].push(...results[0]);
  }

  return options;
}

module.exports = {
  parse_flags,
  remove_flags,
  flag_to_options,
  create_query,
  allFlags,
};
