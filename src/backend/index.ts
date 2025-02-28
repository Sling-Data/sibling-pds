import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Hello, Sibling!" });
});

app.listen(3000, () => {
  console.log("Backend running on port 3000");
});
