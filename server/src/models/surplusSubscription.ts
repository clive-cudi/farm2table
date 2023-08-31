import mongoose, { Model } from "mongoose";
import { ISurplusBid, SurplusBidSchema } from "./surplusBid";

const Schema = mongoose.Schema;

export interface ISurplusSubcription {
  source: string;
  ssid: string;
  name: string;
  description: string;
  q_variant: string;
  category: string;
  q_range: {
    from: number;
    to: number;
  };
  bid?: ISurplusBid;
  _doc?: any;
}

const surplusSubscriptionSchema = new Schema<
  ISurplusSubcription,
  Model<ISurplusSubcription>,
  ISurplusSubcription
>({
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
  bid: SurplusBidSchema,
});

const SurplusSubscription = mongoose.model(
  "surplus_subs",
  surplusSubscriptionSchema
);

export { SurplusSubscription, surplusSubscriptionSchema };

