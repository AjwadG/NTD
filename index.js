// Importing necessary packages
import "dotenv/config";
import bodyParser from "body-parser";
import express from "express";
import { compile } from "./compile.js";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import MongoStore from "connect-mongo";

// Initializing Express app
const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Setting up the public directory to serve static files
app.use(express.static("public"));

// Creating a MongoDB session store
const mongoStore = MongoStore.create({
  mongoUrl: process.env.DB,
  dbName: "NTD",
  collectionName: "sessions",
});

// Listening for errors in the MongoDB session store
mongoStore.on("error", function (error) {
  console.log(error);
});

// Configuring the session middleware
const sessionMiddleware = session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
  },
});

// Adding the session middleware to the app
app.use(sessionMiddleware);

// Initializing Passport
app.use(passport.initialize());
app.use(passport.session());

// Connecting to the MongoDB database
mongoose.connect(process.env.DB);

// Defining the schema for the user data
const answer = {
  question: String,
  answer: String,
  time: {
    type: Date,
    default: Date.now(),
  },
};

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  level: String,
  answer: {
    type: [answer],
    default: [],
  },
});

// Adding passport-local-mongoose to the user schema
userSchema.plugin(passportLocalMongoose);

// Defining the schema for the competition data
const question = {
  id: String,
  question: String,
  Options: [String],
  code: String,
  answer: String,
};

const compettion = new mongoose.Schema({
  level: String,
  question: {
    type: [question],
    default: [],
  },
});

// Creating models for the user and competition data
const User = mongoose.model("User", userSchema);
const Comp = mongoose.model("Comp", compettion);

// Setting up passport to use the user schema
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Defining the home route
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("home.ejs", { level: req.user.level });
  } else {
    res.render("index.ejs");
  }
});

// Defining the signup route
app.post("/signup", (req, res) => {
  let name = req.body.name,
    username = req.body.name,
    pass = req.body.password,
    level = req.body.level;
  User.register({ name, username, level }, pass, (err, user) => {
    if (err) console.log(err);
    res.redirect("/");
  });
});

// Defining the login route
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failWithError: true,
  }),
  function (err, req, res, next) {
    if (err) console.log(err);
    res.redirect("/");
  }
);

// Defining the logout route
app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
});

// Defining the level 1 route
app.get("/1", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("level1.ejs");
  } else {
    res.redirect("/");
  }
});

// Defining the level 2 route
app.get("/2", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("level2.ejs");
  } else {
    res.redirect("/");
  }
});

// Defining the question route
app.post("/que", async (req, res) => {
  if (req.isAuthenticated()) {
    const comp = await Comp.findOne({ level: req.user.level });
    const id = req.body.id;
    const level = req.user.level;
    let compiler = req.body.compiler;
    let code = req.body.code;
    let correct = false;
    let name = req.user.username.replace(/ /g, "_");
    let data = await compile(compiler, code, name);
    if (comp && data === comp.question[id - 1].answer) {
      correct = true;
    }
    res.json({ compiler, code, data, correct });
    if (correct) {
      User.updateOne(
        { username: req.user.username },
        { $push: { answer: { question: id, answer: data, time: Date.now() } } }
      );
    }
  } else {
    res.json({ data: "Not logged in" });
  }
});

// Defining the server to listen on the specified port
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
