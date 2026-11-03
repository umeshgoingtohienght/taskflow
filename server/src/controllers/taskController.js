import mongoose from "mongoose";
import Task, { PRIORITIES, STATUSES } from "../models/Task.js";
import { asyncHandler, HttpError } from "../utils/http.js";

const ALLOWED_FIELDS = ["title", "description", "status", "priority", "dueDate", "tags"];
const pick = (body) =>
  Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED_FIELDS.includes(k)));

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  due: { dueDate: 1 },
  priority: { priorityRank: -1, createdAt: -1 },
};

// GET /api/tasks?status=&priority=&search=&sort=&page=&limit=
export const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, search, sort = "newest" } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

  const match = { user: req.user._id };
  if (status && STATUSES.includes(status)) match.status = status;
  if (priority && PRIORITIES.includes(priority)) match.priority = priority;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { title: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
    ];
  }

  const [tasks, total] = await Promise.all([
    Task.aggregate([
      { $match: match },
      {
        $addFields: {
          priorityRank: { $indexOfArray: [PRIORITIES, "$priority"] },
        },
      },
      { $sort: SORTS[sort] || SORTS.newest },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: { priorityRank: 0, __v: 0 } },
    ]),
    Task.countDocuments(match),
  ]);

  res.json({ tasks, page, pages: Math.ceil(total / limit) || 1, total });
});

// GET /api/tasks/stats
export const getStats = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const [byStatus, overdue] = await Promise.all([
    Task.aggregate([{ $match: { user: userId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.countDocuments({ user: userId, status: { $ne: "done" }, dueDate: { $lt: new Date() } }),
  ]);
  const stats = { todo: 0, "in-progress": 0, done: 0, overdue };
  byStatus.forEach(({ _id, count }) => (stats[_id] = count));
  stats.total = stats.todo + stats["in-progress"] + stats.done;
  stats.completionRate = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  res.json(stats);
});

// POST /api/tasks
export const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...pick(req.body), user: req.user._id });
  res.status(201).json(task);
});

const findOwnTask = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid task id");
  const task = await Task.findOne({ _id: id, user: userId });
  if (!task) throw new HttpError(404, "Task not found");
  return task;
};

// GET /api/tasks/:id
export const getTask = asyncHandler(async (req, res) => {
  res.json(await findOwnTask(req.params.id, req.user._id));
});

// PATCH /api/tasks/:id
export const updateTask = asyncHandler(async (req, res) => {
  const task = await findOwnTask(req.params.id, req.user._id);
  Object.assign(task, pick(req.body));
  await task.save();
  res.json(task);
});

// DELETE /api/tasks/:id
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await findOwnTask(req.params.id, req.user._id);
  await task.deleteOne();
  res.status(204).end();
});
