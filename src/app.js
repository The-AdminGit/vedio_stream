import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"


const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//data come from browser or server in this form like - json, string, link(urlencoded)
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//router import
import userRouter from "./routes/user.routes.js";

// router decration
app.use("/api/v1/users", userRouter);
// http://localhost:5000/api/v1/users/register

export { app };
