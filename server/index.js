import express from "express";
let app = express();

app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
