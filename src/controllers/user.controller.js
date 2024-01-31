import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler((req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

const loginUser = asyncHandler((req, res) => {
  res.status(201).json({
    message: "user Created",
  });
});

export { registerUser, loginUser };
