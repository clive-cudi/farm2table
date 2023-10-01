"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.surplusSubscriptionSchema = exports.SurplusSubscription = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const surplusBid_1 = require("./surplusBid");
const Schema = mongoose_1.default.Schema;
const surplusSubscriptionSchema = new Schema({
    source: {
        type: String,
        required: true,
    },
    ssid: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    q_variant: {
        type: String,
    },
    category: {
        type: String,
    },
    q_range: {
        from: {
            type: Number,
        },
        to: {
            type: Number,
        },
    },
    bid: surplusBid_1.SurplusBidSchema,
});
exports.surplusSubscriptionSchema = surplusSubscriptionSchema;
const SurplusSubscription = mongoose_1.default.model("surplus_subs", surplusSubscriptionSchema);
exports.SurplusSubscription = SurplusSubscription;
