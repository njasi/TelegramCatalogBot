// run this directly with node unless you need to provide the databaseurl and stuff ffor the seed

if (process.env.NODE_ENV == "production") {
  // require("dotenv").config({ path: ".env_deploy" });
  // process.env.DATABASE_URL = process.argv[2];
} else {
  require("dotenv").config({ path: ".env_test" });
}

const db = require("../../server/db");


async function seed() {
  try {
    console.log("Syncing db");
    await db.sync({ force: true });
    // await db.drop(); // sometimes need this to refresh the database cause heroku mean
    await db.close();
  } catch (error) {
    console.log("Error seeding db:");
    console.error(error);
  } finally {
    console.log("Closed db");
    process.exit();
  }
}

seed();
