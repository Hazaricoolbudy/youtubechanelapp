import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "30kb" }));
app.use(express.urlencoded({ limit: "15kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
//import routes
import userRouter from "./routes/user.routes.js";

// route declerations

app.use("/api/v1/users", userRouter);

export { app };
