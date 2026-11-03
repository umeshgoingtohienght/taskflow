import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";
const { default: app } = await import("../src/app.js");

let mongo;
let token;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

describe("Auth", () => {
  it("registers a new user and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Umesh", email: "umesh@example.com", password: "secret123" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
    token = res.body.token;
  });

  it("rejects duplicate emails", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Dup", email: "umesh@example.com", password: "secret123" });
    expect(res.status).toBe(409);
  });

  it("rejects a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "umesh@example.com", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("blocks protected routes without a token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });
});

describe("Tasks", () => {
  let taskId;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  it("creates a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set(auth())
      .send({ title: "Write README", priority: "high" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("todo");
    taskId = res.body._id;
  });

  it("validates required fields", async () => {
    const res = await request(app).post("/api/tasks").set(auth()).send({});
    expect(res.status).toBe(400);
  });

  it("lists, filters and searches tasks", async () => {
    await request(app).post("/api/tasks").set(auth()).send({ title: "Deploy app", priority: "low" });
    const all = await request(app).get("/api/tasks").set(auth());
    expect(all.body.total).toBe(2);
    const high = await request(app).get("/api/tasks?priority=high").set(auth());
    expect(high.body.tasks).toHaveLength(1);
    const search = await request(app).get("/api/tasks?search=deploy").set(auth());
    expect(search.body.tasks[0].title).toBe("Deploy app");
  });

  it("updates a task status", async () => {
    const res = await request(app).patch(`/api/tasks/${taskId}`).set(auth()).send({ status: "done" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("done");
  });

  it("returns stats", async () => {
    const res = await request(app).get("/api/tasks/stats").set(auth());
    expect(res.body).toMatchObject({ total: 2, done: 1, todo: 1, completionRate: 50 });
  });

  it("prevents access to another user's task", async () => {
    const other = await request(app)
      .post("/api/auth/register")
      .send({ name: "Other", email: "other@example.com", password: "secret123" });
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set({ Authorization: `Bearer ${other.body.token}` });
    expect(res.status).toBe(404);
  });

  it("deletes a task", async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`).set(auth());
    expect(res.status).toBe(204);
  });
});
