const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    if (!title) {
      return res.status(400).json({ error: "Task title is required." });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: "Task title must be 200 characters or fewer." });
    }
    const task = await Task.create({ title });
    return res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid task ID." });
    }
    const updates = {};
    if (typeof req.body.completed === "boolean") updates.completed = req.body.completed;
    if (typeof req.body.title === "string") {
      const title = req.body.title.trim();
      if (!title || title.length > 200) {
        return res.status(400).json({ error: "Task title must be between 1 and 200 characters." });
      }
      updates.title = title;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Provide a title or completed field to update." });
    }
    const task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!task) return res.status(404).json({ error: "Task not found." });
    return res.json(task);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid task ID." });
    }
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found." });
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
