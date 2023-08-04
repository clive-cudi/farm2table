import express, { Request, Response } from "express";
import { PORT, MONGO_URI } from "./config";
import mongoose from "mongoose";

const app = express();

mongoose
  .connect(MONGO_URI ?? "")
  .then(() => {
    console.log(`[INFO] Connected to DB`);
  })
  .catch((e) => {
    console.log(`[Error] Failed to connect to DB`, e);
  });

app.get("/", (req: Request, res: Response) => {
  return res.status(200).send("Farm2Table API");
});

app.listen(PORT, () => {
  console.log(`Server up on PORT: ${PORT}`);
});

