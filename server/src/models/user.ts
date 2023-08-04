import mongoose, { Model } from "mongoose";

const Schema = mongoose.Schema;

export interface IUserType {
    uid: string;
    phone: string;
    usertype: string,
    password: string;
    username: string;
}

const userSchema = new Schema<IUserType, Model<IUserType>, IUserType>({
    uid: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    usertype: {
        type: String,
        required: true
    },
    password: {
         type: String,
         required: true
    },
    username: {
        type: String,
        required: true
    }
});

const User = mongoose.model("users", userSchema);

export {User, userSchema};