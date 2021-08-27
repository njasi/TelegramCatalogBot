const Sequelize = require("sequelize");
const db = require("../db");
const puppeteer = require("puppeteer");
const webp = require("webp-converter");
const bot = require("../../api/bot/bot");
const { butt, ik } = require("../../api/bot/helpers");
const User = require("./user");
const fs = require("fs");
const tesseract = require("node-tesseract-ocr");
const config = {
  lang: "eng",
  oem: 1,
  psm: 3,
};

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
   * file_unique_id of the content if its a sticker or a forward
   */
  file_unique_id: {
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

Content.prototype.display = async function (
  chat_id,
  confirm = false,
  options = {}
) {
  const buttons = confirm
    ? ik([
        [
          butt("Catalog", `sdesc=${this.id}`),
          butt("Cancel", `delete=true&remove=${this.id}`),
        ],
      ])
    : ik([
        [butt(`Add Description`, `user_state=${this.id}`)],
        ...(this.type == "sticker"
          ? [[butt("Edit OCR", `user_state=${this.id * -1}`)]]
          : [[]]),
      ]);

  try {
    switch (this.type) {
      case "sticker": {
        const res = await bot.sendSticker(chat_id, this.file_id, {
          ...buttons,
        });
        return;
      }
      case "forward": {
        let message = await bot.sendSticker(
          chat_id,
          confirm
            ? fs.createReadStream(`./temp/temp${this.id}.webp`)
            : this.file_id,
          {
            ...buttons,
          }
        );

        // unlink temp images
        await Promise.all([
          new Promise((res, rej) => {
            fs.unlink(`./temp/temp${this.id}.webp`, (err) => {
              res(); // dont really care about errors since itll be on herokus system and cleared on its own
            });
          }),
          new Promise((res, rej) => {
            fs.unlink(`./temp/temp${this.id}.png`, (err) => {
              res();
            });
          }),
        ]);

        // save the file_ids since its the first time sending it
        if (confirm) {
          this.file_id = message.sticker.file_id;
          this.file_unique_id = message.sticker.file_unique_id;
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
      return {
        type: "document",
        id: this.id,
        document_url: this.file_id,
        thumb_url: this.file_id,
        title: this.description.text,
        description: `${
          this.type[0].toUpperCase() + this.type.substr(1)
        } from ${this.description.name.split("(")[0]}`,
        mime_type: "application/pdf",
      };
    }
    default: {
      // console.log("Default");
    }
  }
};
// TODO: mash add sticker and add forward together
/**
 * Sticker specific stuff
 */
Content.addSticker = async function (message) {
  // TODO: use the createstickerset method to make an archive of stickers so they can never be deleted
  // find who is submitting this to the bot
  const user = await User.findOne({ where: { telegram_id: message.from.id } });
  const exists = await Content.findAll({
    where: { file_unique_id: message.sticker.file_unique_id },
  });

  // if it exists return its id so we can send the view button
  if (exists.length > 0) {
    return { exists: exists[0].id };
  }

  // grab the file url
  let file_url = await bot.getFile(message.sticker.file_id);
  file_url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_url.file_path}`;

  // OCR on any text that may exist
  let text = "";
  try {
    text = await new Promise((res, rej) => {
      tesseract
        .recognize(file_url, config)
        .then((text) => {
          res(text.replace(/\s/g, " "));
        })
        .catch((error) => {
          rej(error);
        });
    });
  } catch (error) {
    // TODO: failed ocr message
    console.log(error.stack);
    bot.sendMessage(
      process.env.ADMIN_ID,
      `There was an error running ocr:\n${error.stack}`
    );
  }

  // // Create it

  const out = await Content.create({
    type: "sticker",
    from_id: null,
    file_id: message.sticker.file_id,
    file_unique_id: message.sticker.file_unique_id,
    description: {
      user: [message.sticker.emoji], // make first index the emoji so it exists somewhere parseable
      text,
      name: `${message.sticker.set_name}`,
    },
    userId: user.id,
  });

  return out;
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

  // find who is submitting this to the bot
  const user = await User.findOne({ where: { telegram_id: message.from.id } });

  // create
  const out = await Content.create({
    type: "forward",
    from_id: ff.id,
    description: { user: [], text: message.text, name: `${name}${username}` },
    userId: user.id,
  });

  // create the image if it exists
  const create_image = async (tries = 0) => {
    try {
      await Content.forwardToImage(
        name,
        message.text,
        message.entities,
        out.id
      );
    } catch (error) {
      console.log("\nERROR:\n", error.message);
      if (
        error.message.indexOf("MaxListenersExceededWarning") !== 0 &&
        tries < 10
      ) {
        await new Promise((res, rej) => setTimeout(() => res(), 5000));
        await create_image((tries = tries + 1));
      } else {
        // remove forward for now and tell the user to try again later
        await out.destroy();
        bot.sendMessage(
          process.env.ADMIN_ID,
          `There was an error rendering a forward:\n${error}`
        );

        return { error: error.message };
      }
    }
  };

  await create_image();

  return out;
};

Content.forwardToImage = async function (name, text, entities, id) {
  // parse entities into html tags
  const parsed_text = entities_to_string(text, entities);
  // text and name into telegram message html
  const html = forward_to_html(parsed_text, name);
  // convert result png into webp
  const res = await html_to_webp(html, id);
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

async function html_to_png(html, id) {
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
    path: `./temp/temp${id}.png`,
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

async function html_to_webp(html, id) {
  await html_to_png(html, id);

  const result = await webp.cwebp(
    `./temp/temp${id}.png`,
    `./temp/temp${id}.webp`,
    "-q 100"
  );
  return result;
}

module.exports = Content;
