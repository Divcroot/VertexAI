import {
  Schema,
  model,
  type Document,
  type Types,
} from "mongoose";

export interface IProject extends Document {
  owner: Types.ObjectId;
  name: string;
  description: string;
  starred: boolean;
  lastOpenedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
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

projectSchema.index({
  owner: 1,
  starred: 1,
});

projectSchema.index({
  owner: 1,
  updatedAt: -1,
});

const Project = model<IProject>(
  "Project",
  projectSchema,
);

export default Project;