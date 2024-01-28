// require('dotenv').config({path:'./env'})

import dotenv from 'dotenv'
import connecDB from './db/index.js';

dotenv.config({
    path: './env'
})
connecDB()














/*
this is a aproch is correct but not good way and another way
import Express from "express";
const app = Express();
(async () => {
  try {
    mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("error", error);
      throw error;
    });

    app.listen(process.env.PORT,()=>{
        console.log(`Port listen on ${process.env.PORT}`);
    })
  } catch (error) {
    console.error("error", error);
    throw err;
  }
})();
*/