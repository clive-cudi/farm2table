import express, { Request, Response } from "express";
import { PORT, MONGO_URI } from "./config";
import mongoose from "mongoose";
import UssdMenu from 'ussd-builder';
import { ussd_controller } from "./controllers/ussd.controller";
import morgan from "morgan";
import bodyparser from 'body-parser';

const app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: false}))

app.use(morgan("dev"))

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


app.post("/ussd", ussd_controller);

app.listen(PORT, () => {
  console.log(`Server up on PORT: ${PORT}`);
});

