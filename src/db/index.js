import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

console.log(process.env.DATABASE_URI);
const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URI}/${DB_NAME}`
    );
    console.log(
      `Database Connected !! on host ${process.env.DATABASE_URI}/${DB_NAME}  `
    );
  } catch (error) {
    console.log("Mongodb Error", error);
    process.exit(1);
  }
};

export default connectDb;
