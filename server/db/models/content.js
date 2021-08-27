const Sequelize = require("sequelize");
const db = require("../db");
const puppeteer = require("puppeteer");
const webp = require("webp-converter");
const bot = require("../../api/bot/bot");
const { butt, ik } = require("../../api/bot/helpers");
const User = require("./user");
const util = require("util");

const Content = db.define("content", {
  /**
   * telegram_id of who sent the og message,
   * or the person who contributed the content otherwise
   */
  from_id: {
    type: Sequelize.INTEGER,
  },
  /**
   * what the content is
   */
  type: {
    type: Sequelize.ENUM("sticker", "forward"),
  },
  /**
   * includes text in the image,
   * text people have added,
   * text from sticker set etc
   */
  description: {
    type: Sequelize.JSON,
    defaultValue: { users: [] },
    allowNull: false,
  },
  /**
   * file_id of the content if its a sticker or a forward
   */
  file_id: {
    type: Sequelize.STRING,
  },
  /**
   * how many times the content has been sent
   */
  uses: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  /**
   * misc json col to stuff things into later
   */
  misc: {
    type: Sequelize.JSON,
    defaultValue: {},
  },
});

Content.prototype.display = async function (chat_id, confirm = false) {
  const buttons = confirm
    ? ik([
        [
          butt("Confirm", `sdesc=${this.id}`),
          butt("Cancel", `delete=true&remove=${this.id}`),
        ],
      ])
    : ik([[butt("Add Description", `user_state=${this.id}`)]]);

  try {
    switch (this.type) {
      case "sticker": {
      }
      case "forward": {
        let message = await bot.sendDocument(
          chat_id,
          confirm ? "./temp/temp.webp" : this.file_id,
          {
            ...buttons,
          }
        );

        if (confirm) {
          this.file_id = message.sticker.file_id;
          await this.save();
        }
        return;
      }
      default: {
        // console.log("Default");
      }
    }
  } catch (error) {
    bot.sendMessage(
      process.env.ADMIN_ID,
      `Error displaying ${this.type}:\n${error.stack}`
    );
  }
};

Content.prototype.to_inline_button = function () {
  switch (this.type) {
    case "sticker":
    case "forward": {
      return { type: "sticker", id: this.id, sticker_file_id: this.file_id };
    }
    default: {
      // console.log("Default");
    }
  }
};

/**
 * Sticker specific stuff
 */

Content.addSticker = async function (message) {
  console.log(message);
  // await Content.findAll({where:{file_id:message.sticker}})
};

/**
 * Forward specific stuff
 */

// TODO support forwards that have images
Content.addForward = async function (message) {
  // setup consts
  const ff = message.forward_from;
  const first = ff.first_name || "";
  const last = ff.last_name ? " " + ff.last_name : "";
  const username = ff.username ? " (@" + ff.username + ")" : "";
  const name = `${first}${last}`;

  // find who is submitting this to the bot
  const user = await User.findOne({ where: { telegram_id: message.from.id } });

  // see if it already exists (rn it checks text and user) later may want only text
  const exists = await Content.findAll({
    where: {
      type: "forward",
      description: { text: message.text },
      from_id: ff.id,
    },
  });

  // if it exists return its id so we can send the view button
  if (exists.length > 0) {
    return { exists: exists[0].id };
  }

  // create the image if it exists
  await Content.forwardToImage(name, message.text, message.entities);

  // create
  const out = await Content.create({
    type: "forward",
    from_id: ff.id,
    description: { user: [], text: message.text, name: `${name}${username}` },
    userId: user.id,
  });

  return out;
};

Content.forwardToImage = async function (name, text, entities) {
  // parse entities into html tags
  const parsed_text = entities_to_string(text, entities);
  // text and name into telegram message html
  const html = forward_to_html(parsed_text, name);
  // convert result png into webp
  const res = await html_to_webp(html);
  return res;
};

function entities_to_string(text, entities) {
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  if (!entities) {
    return text;
  }
  const tag_dict = {
    bold: (a) => (a ? "<" : "</") + "b>",
    strikethrough: (a) => (a ? "<" : "</") + "strike>",
    italic: (a) => (a ? "<" : "</") + "em>",
    underline: (a) => (a ? "<" : "</") + "u>",
    code: (a) => (a ? "<" : "</") + "code>",
    pre: (a) => (a ? "<" : "</") + "code>",
    bot_command: (a) => (a ? `<span style="color:#8774e1">` : "</span>"),
  };
  let pre_off = -1;
  const tags = []; // offset:{start,end,offset,length}
  let ofs = 0;
  for (let i = 0; i < entities.length; i++) {
    const curr = ofs + i;
    tags[curr] = entities[i];
    if (
      curr > 0 &&
      tags[curr - 1].offset + tags[curr - 1].length > entities[i].offset
    ) {
      // left of split
      const full_len = tags[curr - 1].length;
      tags[curr - 1] = {
        ...tags[curr - 1],
        length: entities[i].offset - tags[curr - 1].offset,
      };
      // right of split
      tags[curr] = {
        ...tags[curr - 1],
        offset: entities[i].offset,
        length: full_len - tags[curr - 1].length,
      };
      // new
      tags[curr + 1] = entities[i];
      ofs++;
    }
  }

  let parsed = "";
  for (let i = 0; i < text.length; i++) {
    for (let j = 0; j < tags.length; j++) {
      if (tags[j].offset == i) {
        parsed += tag_dict[tags[j].type](true);
      }
      const span = tags[j].offset + tags[j].length;
      if (span == i) {
        parsed += tag_dict[tags[j].type](false);
      } else if (i + 1 == text.length && span >= text.length) {
        parsed += text[i] + tag_dict[tags[j].type](false);
        i = -1;
        break;
      }
    }
    if (i == -1) {
      break;
    }
    parsed += text[i];
  }
  return parsed;
}

function forward_to_html(text, name) {
  return `<html>
  <head>
    <meta charset="UTF-8">
    <style>
      html {
        font-family: "Roboto",
          /* -apple-system, */ /* apple color emoji, */ BlinkMacSystemFont,
          "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue",
          sans-serif;
      }
       body {
        background-color: rgb(15, 15, 15);
        width: 980px;
        height: auto;
        margin: 0;
      }

      #bubble {
        border-radius: 12px;
        /* border-bottom-left-radius: 0; */
        background-color: #212121;
        color: #fff;

        font-size: 32px;
        line-height: 1.5;

        min-width: 112px;
        max-width: 490px;
        box-shadow: 0 2px 4px 0 rgb(16 35 47 / 15%);
        position: relative;
        display: flex;
        flex-direction: column-reverse;
        width: -webkit-max-content;
        width: -moz-max-content;
        width: max-content;
        height: -webkit-fit-content;
        height: -moz-fit-content;
        height: fit-content;
        border-color: #0f0f0f;
        font-weight: 300;
      }

      #message {
        padding: 0 1rem 0.75rem 1.25rem;
        line-height: 1.3125;
        word-break: break-word;
        /* white-space: pre-wrap; */
        position: relative;
      }

      #forward-from {
        padding: 10px 18px 0 18px;
        font-weight: 500 !important;
        color: #3390ec;
        font-size: 1.8rem;
        max-width: 1024px;
        overflow: hidden;
        text-overflow: ellipsis;
        order: 1;
      }
    </style>
  </head>
  <body>
    <div id="bubble">
      <div id="message">${text}</div>
      <div id="forward-from">
        Forwarded from <span id="name">${name}</span>
      </div>
    </div>
  </body>
</html>`;
}

async function html_to_png(html) {
  // setup browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html);

  // wait until all images have loaded
  await page.evaluate(async () => {
    const selectors = Array.from(document.querySelectorAll("img"));
    await Promise.all(
      selectors.map((img) => {
        if (img.complete) return;
        return new Promise((resolve, reject) => {
          img.addEventListener("load", resolve);
          img.addEventListener("error", reject);
        });
      })
    );
  });

  // wait a second for other resources
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  // calc size
  const size = await page.evaluate(() => {
    document.body.style.background = "transparent";
    const div = document.getElementById("bubble");
    return {
      height: div.offsetHeight + "px",
      width: div.offsetWidth + "px",
    };
  });

  // debug screenshot for debugging
  await page.screenshot({
    path: "./temp/temp.png",
    type: "png",
    omitBackground: true,
    clip: {
      x: 0,
      y: 0,
      width: parseInt(size.width),
      height: parseInt(size.height),
    },
  });
  await page.close();
  await browser.close();
}

async function html_to_webp(html) {
  await html_to_png(html);

  const result = await webp.cwebp(
    "./temp/temp.png",
    "./temp/temp.webp",
    "-q 100"
  );
  return result;
}

module.exports = Content;
