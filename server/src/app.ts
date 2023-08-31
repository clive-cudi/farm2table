import express, { Request, Response } from "express";
import { PORT, MONGO_URI } from "./config";
import mongoose from "mongoose";
import UssdMenu from 'ussd-builder';
import { ussd_controller } from "./controllers/ussd.controller";
import morgan from "morgan";
import bodyparser from 'body-parser';
import { User } from "./models/user";
import { SurplusProduct } from "./models/surplusProduct";
import { SurplusBid } from "./models/surplusBid";
import { v4 as uuid } from "uuid";
import { messagesChannel } from "./utils/amqp";
import { Buffer } from "buffer";

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

app.get("/org", (req: Request, res: Response) => {
  const { orgID } = req.query;

  if (orgID) {
    User.findOne({uid: orgID}).then((org) => {
      if (org) {
        return res.status(200).json({
          success: true,
          message: "successfully fetched org details",
          payload: org
        })
      } else {
        return res.status(404).json({
          success: false,
          message: "Org not found",
          payload: null
        })
      }
    })
  } else {
    return res.status(403).json({
      success: false,
      message: "Please provide the organization ID",
      payload: null
    })
  }
});

app.get(`/surplusproduct`, (req: Request, res: Response) => {
  const { spid } = req.query;

  if (spid) {
    SurplusProduct.findOne({spid: spid}).then((sp_) => {
      if (sp_) {
        return res.status(200).json({
          success: true,
          message: "Successfully fetched surplus product",
          payload: sp_
        })
      } else {
        return res.status(404).json({
          success: false,
          message: "SP not found",
          payload: null
        })
      }
    })
  } else {
    return res.status(403).json({
      success: false,
      message: "Please provide the spid",
      payload: null
    })
  }
});

app.post(`/placebid`, (req: Request, res: Response) => {
  const { phone, spid, amount } = req.body;

  if (!phone || !amount || !spid) {
    return res.status(403).json({
      success: false,
      message: "Please provide the necessary details",
      payload: null
    })
  }

  const newBidTemplate = {
    sbid: `sb_${uuid()}`,
    source: phone,
    amount: amount
  }

  const newBid = new SurplusBid(newBidTemplate);

  newBid.save().then((bid) => {
    SurplusProduct.updateOne({spid: spid}, {$push: {'bids': bid.sbid}}).then(async (sp_saved_bid) => {
      // notify the donor via sms
      const channel = await messagesChannel();

      channel.sendToQueue("messages", Buffer.from(JSON.stringify({...newBidTemplate, spid, msg_domain: "placebid"})));
      return res.status(200).json({
        success: true,
        message: "Successfully saved bid",
        payload: sp_saved_bid
      })
    }).catch((sp_save_err) => {
      console.log(sp_save_err)
      return res.status(400).json({
        success: false,
        message: "Error saving bid",
        payload: null
      })
    })
  }).catch((bid_save_err) => {
    console.log(bid_save_err);
    return res.status(400).json({
      success: false,
      message: "Error saving bid",
      payload: null
    })
  })
})

app.listen(PORT, () => {
  console.log(`Server up on PORT: ${PORT}`);
});

