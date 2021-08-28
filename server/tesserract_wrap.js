/**
 * a bad wrapper for tesserct because heroku seems to really dislike the other one
 * and its quicker to do this than figure out why
 *
 * using a buildpack to get tesseract on heroku is easy so why not directly run it
 */

const axios = require("axios");
const fs = require("fs");
const Tesseract = require("tesseract.js");
// const { spawn } = require("child_process");

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

// async function tesseract_ocr(
//   image_path,
//   url = false,
//   options = ["quiet", "-l", "eng", "--oem", "1", "--psm", "3"]
// ) {
//   let temp_image_path;
//   if (url) {
//     temp_image_path = `./temp/${image_path.split("/").pop()}`;
//     await download_image(image_path, temp_image_path);
//     console.log(`Downloaded ${temp_image_path}`);
//   }
//   const result = await new Promise((res, rej) => {
//     try {
//       console.log("\nRUN TESSERACT:\n", `tesseract`, [
//         //${temp_image_path} stdout
//         temp_image_path,
//         "stdout",
//         ...options,
//       ]);

//       const ocr_res = spawn(`tesseract`, [
//         //${temp_image_path} stdout
//         temp_image_path,
//         "stdout",
//         ...options,
//       ]);

//       ocr_res.stderr.on("data", (data) => {
//         const str = data.toString();
//         console.log("FAKE TESSERACT ERROR:\n", str);
//         // bad check to see if its not a warning
//         if (str.indexOf("Warning") == -1 && str.indexOf("Estimating") == -1) {
//           rej(data.toString());
//         }
//       });

//       ocr_res.stdout.on("data", (data) => {
//         console.log(data.toString());
//         res(data.toString());
//       });
//     } catch (error) {
//       rej(error);
//     }
//   });
//   fs.unlink(temp_image_path, (err) => {});
//   console.log("RESULT:\n", result);
//   return result;
// }

// const config = {
//   lang: "eng",
//   oem: 1,
//   psm: 3,
// };

// none of these versions actually work on heroku... even with buildpacks
// TODO get this to work or use another ocr
async function tesseract_ocr(image_path, options = {}) {
  return "";
}

// async function tesseract_ocr(image_path, options = {}) {
//   let temp_image_path = image_path;
//   if (options.url) {
//     // make a temp local file
//     temp_image_path = `./temp/${image_path.split("/").pop()}`;
//     await download_image(image_path, temp_image_path);
//     console.log(`Downloaded ${temp_image_path}`);
//   }
//   let text = "";
//   try {
//     console.log("try",image_path)
//     text = await new Promise((res, rej) => {
//       Tesseract.recognize(image_path, "eng", {
//         logger: (m) => console.log(m),
//       })
//         .then(({ data: { text } }) => {
//           res(text);
//         })
//         .catch((err) => {
//           rej(err);
//         });
//     });
//   } catch (error) {
//     console.log("ERROR:\n",error);
//   }

//   fs.unlink(temp_image_path, (err) => {
//     console.log(`Unlinked ${temp_image_path}`);
//   });

//   return text;
// }

module.exports = tesseract_ocr;
