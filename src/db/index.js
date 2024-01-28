import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dataBase = process.env.MONGODB_URL;
const connecDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${dataBase}/${DB_NAME}`);
    console.log(`\n Mongoose DB Connect !! DB-Host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("Mongose connection error", error);
    process.exit(1);
  }
};

export default connecDB;