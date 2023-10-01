"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const mongoose_1 = __importDefault(require("mongoose"));
const ussd_controller_1 = require("./controllers/ussd.controller");
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const user_1 = require("./models/user");
const surplusProduct_1 = require("./models/surplusProduct");
const surplusBid_1 = require("./models/surplusBid");
const uuid_1 = require("uuid");
const amqp_1 = require("./utils/amqp");
const buffer_1 = require("buffer");
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, morgan_1.default)("dev"));
mongoose_1.default
    .connect(config_1.MONGO_URI !== null && config_1.MONGO_URI !== void 0 ? config_1.MONGO_URI : "")
    .then(() => {
    console.log(`[INFO] Connected to DB`);
})
    .catch((e) => {
    console.log(`[Error] Failed to connect to DB`, e);
});
app.get("/", (req, res) => {
    return res.status(200).send("Farm2Table API");
});
app.post("/ussd", ussd_controller_1.ussd_controller);
app.get("/org", (req, res) => {
    const { orgID } = req.query;
    if (orgID) {
        user_1.User.findOne({ uid: orgID }).then((org) => {
            if (org) {
                return res.status(200).json({
                    success: true,
                    message: "successfully fetched org details",
                    payload: org
                });
            }
            else {
                return res.status(404).json({
                    success: false,
                    message: "Org not found",
                    payload: null
                });
            }
        });
    }
    else {
        return res.status(403).json({
            success: false,
            message: "Please provide the organization ID",
            payload: null
        });
    }
});
app.get(`/surplusproduct`, (req, res) => {
    const { spid } = req.query;
    if (spid) {
        surplusProduct_1.SurplusProduct.findOne({ spid: spid }).then((sp_) => {
            if (sp_) {
                return res.status(200).json({
                    success: true,
                    message: "Successfully fetched surplus product",
                    payload: sp_
                });
            }
            else {
                return res.status(404).json({
                    success: false,
                    message: "SP not found",
                    payload: null
                });
            }
        });
    }
    else {
        return res.status(403).json({
            success: false,
            message: "Please provide the spid",
            payload: null
        });
    }
});
app.post(`/placebid`, (req, res) => {
    const { phone, spid, amount } = req.body;
    if (!phone || !amount || !spid) {
        return res.status(403).json({
            success: false,
            message: "Please provide the necessary details",
            payload: null
        });
    }
    const newBidTemplate = {
        sbid: `sb_${(0, uuid_1.v4)()}`,
        source: phone,
        amount: amount
    };
    const newBid = new surplusBid_1.SurplusBid(newBidTemplate);
    newBid.save().then((bid) => {
        surplusProduct_1.SurplusProduct.updateOne({ spid: spid }, { $push: { 'bids': bid.sbid } }).then((sp_saved_bid) => __awaiter(void 0, void 0, void 0, function* () {
            // notify the donor via sms
            const channel = yield (0, amqp_1.messagesChannel)();
            channel.sendToQueue("messages", buffer_1.Buffer.from(JSON.stringify(Object.assign(Object.assign({}, newBidTemplate), { spid, msg_domain: "placebid" }))));
            return res.status(200).json({
                success: true,
                message: "Successfully saved bid",
                payload: sp_saved_bid
            });
        })).catch((sp_save_err) => {
            console.log(sp_save_err);
            return res.status(400).json({
                success: false,
                message: "Error saving bid",
                payload: null
            });
        });
    }).catch((bid_save_err) => {
        console.log(bid_save_err);
        return res.status(400).json({
            success: false,
            message: "Error saving bid",
            payload: null
        });
    });
});
app.get('/bids', (req, res) => {
    const { owner } = req.query;
    if (!owner) {
        return res.status(403).json({
            success: false,
            message: "Please provide the owner phone",
            payload: null
        });
    }
    // User.findOne({phone: owner, usertype: "donor"}).then((usr) => {
    //   if (usr) {
    //     return res.status(200).json({
    //       success: true,
    //       message: "Successfully fetched bids",
    //       payload: usr.bi
    //     })
    //   }
    // })
    surplusProduct_1.SurplusProduct.find({ owner: owner }).then((products) => {
        if (products) {
            return res.status(200).json({
                success: true,
                message: ""
            });
        }
    });
});
app.listen(config_1.PORT, () => {
    console.log(`Server up on PORT: ${config_1.PORT}`);
});
