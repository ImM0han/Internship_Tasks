import express from "express";
import Task from "../models/Task.js";

const router = express.Router();

/**
 * GET /api/tasks?search=&filter=all|active|completed&priority=all|low|medium|high
 */
router.get("/", async (req, res) => {
  const { search = "", filter = "all", priority = "all" } = req.query;

  const q = {};
  if (search.trim()) q.title = { $regex: search.trim(), $options: "i" };
  if (filter === "active") q.completed = false;
  if (filter === "completed") q.completed = true;
  if (priority !== "all") q.priority = priority;

  const tasks = await Task.find(q).sort({ createdAt: -1 });
  res.json(tasks);
});

router.post("/", async (req, res) => {
  const { title, priority } = req.body;
  if (!title?.trim()) return res.status(400).json({ msg: "Title is required" });

  const task = await Task.create({ title: title.trim(), priority: priority || "medium" });
  res.status(201).json(task);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, priority, completed } = req.body;

  const task = await Task.findByIdAndUpdate(
    id,
    { title, priority, completed },
    { new: true }
  );

  if (!task) return res.status(404).json({ msg: "Task not found" });
  res.json(task);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const task = await Task.findByIdAndDelete(id);
  if (!task) return res.status(404).json({ msg: "Task not found" });
  res.json({ msg: "Deleted" });
});

export default router;
