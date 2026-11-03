import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler, HttpError } from "../utils/http.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Not authorized, token missing");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Not authorized, token invalid or expired");
  }

  const user = await User.findById(payload.id);
  if (!user) throw new HttpError(401, "User no longer exists");
  req.user = user;
  next();
});
