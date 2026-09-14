import express from "express";
import {
    createFile,
    createFolder,
    createRootFolder,
    deleteItem,
    getFile,
    getTree,
    updateItem,
} from "../controllers/file.controller.js";

const router = express.Router();

router.post("/create-root-folder", createRootFolder);
router.post("/create-folder", createFolder);
router.post("/create-file", createFile);
router.post("/update/:id", updateItem);

router.get("/tree/:projectId", getTree);
router.get("/:id", getFile);

router.delete("/:id", deleteItem);

export default router;