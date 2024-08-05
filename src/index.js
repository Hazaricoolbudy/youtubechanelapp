import dotenv from "dotenv";
import connectDb from "./db/index.js";
dotenv.config({
  path: "./env",
});

connectDb()
  .then(() => {
    console.log(`database connected sucessfully`);
  })
  .catch((Err) => {
    console.log(Err);
  });
