const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./Routes/auth");
const postRoutes = require("./Routes/posts");
const app=express();
const PORT = process.env.PORT || 5000;
require("dotenv").config();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("Uploads"));
app.use("/api/auth", authRoutes);
// app.use("/uploads", express.static("uploads"));
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API Working" });
});


app.use("/api/posts", postRoutes);

// fallback to frontend
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});