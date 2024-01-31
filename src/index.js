// require('dotenv').config({path:'./env'})

import dotenv from 'dotenv'
import connecDB from './db/index.js';
import {app} from './app.js'

dotenv.config({
    path: './.env'
})
connecDB()
.then(()=>{
  app.listen(process.env.PORT || 8000 , ()=>{
    console.log(`port running in server ${process.env.PORT}`);
    app.on("error", (error) => {
      console.log("error", error);
      throw error;
    });
  })
})
.catch((err)=>{
  console.log("mongoDb conection established", err);
})














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