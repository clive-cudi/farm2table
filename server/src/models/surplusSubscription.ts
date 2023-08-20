import mongoose, { Model } from "mongoose";

const Schema = mongoose.Schema;

export interface ISurplusSubcription {
    source: string;
    ssid: string;
    name: string;
    description: string;
    q_variant: string;
    category: string;
    q_range: {
        from: number,
        to: number
    }
}

const surplusSubscriptionSchema = new Schema<ISurplusSubcription, Model<ISurplusSubcription>, ISurplusSubcription>({
    source: {
        type: String,
        required: true
    },
    ssid: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    q_variant: {
        type: String
    },
    category: {
        type: String
    },
    q_range: {
        from: {
            type: Number
        },
        to: {
            type: Number
        }
    }
});

const SurplusSubscription = mongoose.model("surplus_subs", surplusSubscriptionSchema);

export {SurplusSubscription, surplusSubscriptionSchema};