import mongoose from "mongoose";

export const STATUSES = ["todo", "in-progress", "done"];
export const PRIORITIES = ["low", "medium", "high"];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: STATUSES, default: "todo" },
    priority: { type: String, enum: PRIORITIES, default: "medium" },
    dueDate: { type: Date },
    tags: [{ type: String, trim: true, lowercase: true }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ title: "text", description: "text" });

export default mongoose.model("Task", taskSchema);
