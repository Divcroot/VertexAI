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
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["file", "folder"],
            required: true,
        },
        extension: {
            type: String,
            default: "",
        },
        language: {
            type: String,
            default: "plaintext",
        },
        content: {
            type: String,
            default: "",
        },
        size: {
            type: Number,
            default: 0,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

const File = model<IFile>("File", fileSchema);

export default File;