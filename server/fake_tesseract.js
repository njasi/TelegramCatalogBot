/**
 * a bad wrapper for tesserct because heroku seems to really dislike the other one
 * and its quicker to do this than figure out why
 *
 * using a buildpack to get tesseract on heroku is easy so why not directly run it
 */

const axios = require("axios");
const { spawn } = require("child_process");
const fs = require("fs");

const download_image = async (url, image_path) =>
  axios({
    url,
    responseType: "stream",
  }).then(
    (response) =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on("finish", () => resolve())
          .on("error", (e) => reject(e));
      })
  );

async function tesseract_ocr(
  image_path,
  url = false,
  flags = ["-l", "eng", "--oem", "1", "--psm", "3"]
) {
  let temp_image_path;
  if (url) {
    temp_image_path = `./temp/${image_path.split("/").pop()}`;
    await download_image(image_path, temp_image_path);
  }
  result = await new Promise((res, rej) => {
    const ocr_res = spawn(`tesseract`, [
      temp_image_path,
      "stdout",
      "quiet",
      ...flags,
    ]);

    ocr_res.stdout.on("data", (data) => {
      res(data.toString());
    });
  });
  fs.unlink(temp_image_path, (err) => {});
  return result;
}

module.exports = tesseract_ocr;
