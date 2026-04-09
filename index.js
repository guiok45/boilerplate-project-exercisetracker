"use strict";

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const uri = process.env.MONGO_URI;
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// MongoDB connection
mongoose.connect(
  "mongodb+srv://guiokgui1_db_user:1234@cluster0.ckvrmuq.mongodb.net/tracker?appName=Cluster0"
);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date,
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/users", async (req, res) => {
  const username = req.body.username;

  if (!username) {
    return res.json({ error: "username required" });
  }

  const user = new User({ username });
  const savedUser = await user.save();

  res.json({
    username: savedUser.username,
    _id: savedUser._id,
  });
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({}, { username: 1, _id: 1 });

  const formatted = users.map((user) => ({
    username: user.username,
    _id: user._id.toString(),
  }));

  res.json(formatted);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;

  const user = await User.findById(req.params._id);

  if (!user) return res.json({ error: "User not found" });

  const exercise = new Exercise({
    userId: user._id,
    description,
    duration: Number(duration),
    date: date ? new Date(date) : new Date(),
  });

  const savedExercise = await exercise.save();

  res.json({
    _id: user._id,
    username: user.username,
    description: savedExercise.description,
    duration: savedExercise.duration,
    date: savedExercise.date.toDateString(),
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;

  const user = await User.findById(req.params._id);
  if (!user) return res.json({ error: "User not found" });

  let filter = { userId: user._id };

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  let exercises = await Exercise.find(filter).limit(Number(limit) || 0);

  const log = exercises.map((ex) => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date.toDateString(),
  }));

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log,
  });
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
