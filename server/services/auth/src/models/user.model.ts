import { Schema, model, type Document } from "mongoose";

export interface IUser extends Document {
    firebaseUid: string;
    name: string;
    email: string;
    avatar: string;
    credits: number;
}

const userSchema = new Schema<IUser>(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true,
            trim: true,
        },

        avatar: {
            type: String,
            default: "",
            trim: true,
        },

        credits: {
            type: Number,
            default: 100,
            min: 0,
        },

    },
    {
        timestamps: true,
    },
);

export const User = model<IUser>("User", userSchema);