import bodyParser from "body-parser";
import express from "express";
import { compile } from "./compile.js";

const port = 3000;

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index.ejs");
});
app.get("/que", (req, res) => {
  res.render("que.ejs");
});

app.post("/que", async (req, res) => {
  let compiler = req.body.compiler;
  let code = req.body.code;
  
  let data = await compile(compiler, code);
  res.json({ compiler, code, data });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
