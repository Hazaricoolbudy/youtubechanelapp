import dotenv from "dotenv";
import connectDb from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: "./env",
});
const port = process.env.PORT || 8000;

connectDb()
  .then(() => {
    console.log(`database connected sucessfully`);
    app.listen(port, () => {
      console.log(`server is runing on port ${port}`);
    });
  })
  .catch((Err) => {
    console.log(Err);
  });
