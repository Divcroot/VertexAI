import { Schema, model, type Document, type Types } from "mongoose";

export interface IProject extends Document {
  owner: Types.ObjectId;
  name: string;
  description?: string;
  starred: boolean;
  lastOpenedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    starred: {
      type: Boolean,
      default: false,
    },
    lastOpenedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Project = model<IProject>("Project", projectSchema);

export default Project;