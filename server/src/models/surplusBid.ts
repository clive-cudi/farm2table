import mongoose, { Model } from "mongoose";

const Schema = mongoose.Schema;

export interface ISurplusBid {
  sbid: string;
  amount: number;
  source: string;
  _doc?: any
}

const SurplusBidSchema = new Schema<
  ISurplusBid,
  Model<ISurplusBid>,
  ISurplusBid
>({
  sbid: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const SurplusBid = mongoose.model("surplus_bids", SurplusBidSchema);

export { SurplusBid, SurplusBidSchema };

