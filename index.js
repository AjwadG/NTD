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
  correct: Boolean,
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
  answer: [String],
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
app.get("/1", async (req, res) => {
  if (req.isAuthenticated()) {
    const user = await User.findOne({ username: req.user.username });
    if (user.answer.length == 12) {
      res.redirect("/");
    } else {
      res.render("level1.ejs");
    }
  } else {
    res.redirect("/");
  }
});
app.post("/1", async (req, res) => {
  if (req.isAuthenticated()) {
    const comp = await Comp.findOne({ level: req.user.level });
    const answers = [];
    const time = Date.now();
    const user = await User.findOne({ username: req.user.username });
    for (let i = 1; i <= comp.question.length; i++) {
      const answer = {
        question: i,
        answer: req.body[i],
        correct: comp.question[i - 1].answer[0] == req.body[i],
        time: time,
      };
      answers.push(answer);
    }
    console.log(answers);
    user.answer = answers;
    user.save();
    res.render("level1.ejs");
  } else {
    res.redirect("/");
  }
});

// Defining the level 2 route
app.get("/2", async (req, res) => {
  if (req.isAuthenticated()) {
    const user = await User.findOne({ username: req.user.username });
    if (user.answer.length == 3) {
      res.redirect("/");
    } else {
      res.render("level2.ejs");
    }
  } else {
    res.redirect("/");
  }
});
app.post("/2", async (req, res) => {
  if (req.isAuthenticated()) {
    const comp = await Comp.findOne({ level: req.user.level });
    const user = await User.findOne({ username: req.user.username });
    const id = req.body.id;
    const compiler = req.body.compiler;
    const code = req.body.code;
    for (let i = 0; i < user.answer.length; i++) {
      if (user.answer[i].question == id) {
        return res.json({
          compiler,
          code,
          data: "already answered",
          correct: true,
        });
      }
    }
    let correct = false;
    const name = req.user.username.replace(/ /g, "_");
    const data = await compile(compiler, code, name);
    const filtered = data
      .replace(/\n/g, "")
      .replace(/\r/g, "")
      .replace(/ /g, "");
    if (
      (comp.question[id - 1].answer[0] == data ||
        comp.question[id - 1].answer[1] == filtered) &&
      code.indexOf(comp.question[id - 1].answer[1]) == -1
    ) {
      correct = true;
    }
    res.json({ compiler, code, data, correct });
    if (correct) {
      const answer = {
        question: id,
        answer: data,
        correct: true,
        time: Date.now(),
      };

      user.answer.push(answer);
      user.save();
    }
  } else {
    res.json({ data: "Not logged in" });
  }
});

app.get('/result', async (req, res) => {
  if (req.isAuthenticated() && req.user.username == 'admin') {
    const user = await User.find({})
    user.sort((a, b) => {
      // First criterion: number of correct answers (descending)
      const aCorrectCount = a.answer.filter(answer => answer.correct).length;
      const bCorrectCount = b.answer.filter(answer => answer.correct).length;
      if (aCorrectCount !== bCorrectCount) {
        return bCorrectCount - aCorrectCount;
      }
    
      // Second criterion: maximum time in answers (ascending)
      const aMaxTime = Math.max(...a.answer.map(answer => answer.time));
      const bMaxTime = Math.max(...b.answer.map(answer => answer.time));
      return aMaxTime - bMaxTime;
    });
    return res.render('result.ejs', { lvl1: user.filter(user => user.level == '1'), lvl2: user.filter(user => user.level == '2') })
  }
  res.redirect('/')
  })

// Defining the server to listen on the specified port
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
