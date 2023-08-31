import mongoose, { Model } from "mongoose";
import { ISurplusBid, SurplusBidSchema, SurplusBid} from "./surplusBid";

const Schema = mongoose.Schema;

export interface ISurplusProduct {
  owner: string;
  spid: string;
  name: string;
  description: string;
  q_variant: string;
  quantity: number;
  category: string;
  isBiddable: boolean;
  bids?: string[];
  _doc?: any;
}

const surplusProductSchema = new Schema<
  ISurplusProduct,
  Model<ISurplusProduct>,
  ISurplusProduct
>(
  {
    owner: {
      type: String,
      required: true,
    },
    spid: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    q_variant: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
    isBiddable: {
      type: Boolean,
      required: true
    },
    bids: [],
  },
  {
    timestamps: true,
  }
);

const SurplusProduct = mongoose.model("surplus_products", surplusProductSchema);

export { SurplusProduct, surplusProductSchema };

