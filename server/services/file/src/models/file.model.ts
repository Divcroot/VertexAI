import { Schema, model, type Document, type Types } from "mongoose";

export interface IFile extends Document {
    owner: Types.ObjectId;
    parentId: Types.ObjectId | null;
    projectId: Types.ObjectId;
    name: string;
    type: "file" | "folder";
    extension: string;
    language: string;
    content: string;
    size: number;
    isDeleted: boolean;
}

const fileSchema = new Schema<IFile>(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: "File",
            default: null,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },
        type: {
            type: String,
            enum: ["file", "folder"],
            required: true,
        },
        extension: {
            type: String,
            default: "",
            trim: true,
        },
        language: {
            type: String,
            default: "plaintext",
            trim: true,
        },
        content: {
            type: String,
            default: "",
        },
        size: {
            type: Number,
            default: 0,
            min: 0,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    },
);

fileSchema.index({
    owner: 1,
    projectId: 1,
    parentId: 1,
    isDeleted: 1,
});

fileSchema.index({
    owner: 1,
    projectId: 1,
    isDeleted: 1,
    createdAt: 1,
});

const File = model<IFile>("File", fileSchema);

export default File;