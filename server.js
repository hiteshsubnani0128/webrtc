const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const {
  v4: uuidV4
} = require("uuid");
const User = require('./models/user');
const bodyParser = require("body-parser");
var session = require("express-session");
var mongoose = require("mongoose");
var passport = require("passport");
const controller = require('./controller/auth');

// const DB = "mongodb://localhost:27017/sih";
const DB = "mongodb+srv://newuser:newuser@cluster0.um27o.mongodb.net/sihgov?retryWrites=true&w=majority";

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then((db) => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });

var db = mongoose.connection;
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

var MongoDBStore = require("connect-mongodb-session")(session);

// =================== Express Session ========================
var store = new MongoDBStore({
  uri: DB,
  collection: "mySessions",
});

// Catch errors
store.on("error", function (error) {
  console.log(error);
});

app.use(
  session({
    secret: "secret",
    store: store,
    saveUninitialized: false,
    resave: false,
    unset: "destroy",
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
  // if there's a flash message in the session request, make it available in the response, then delete it
  res.locals.sessionFlash = req.session.sessionFlash;
  delete req.session.sessionFlash;
  next();
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);


passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.getUserById(id, function (err, user) {
    done(err, user);
  });
});

app
  .get("/", (req, res) => {
    res.render("home", {
      user: req.user,
    });
  })
  .post("/", (req, res) => res.redirect("/e/" + req.body.room));

app.get("/adddata", (req, res) => {
  console.log(req.query);
});

app.get('/login', (req, res) => {

});

app.get('/signup', (req, res) => {
    res.render('signup', {
      user: false
    });
  })
  .post('/signup', controller.signup);


// ====================== Socket IO =================================

app.get("/e/:room", (req, res) => {
  res.render("room", {
    roomId: req.params.room,
    user: req.user
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("hitesh", (msg, roomId, username) => {
      console.log(msg, "From", username);
      // io.emit('hitesh', msg);
      socket.to(roomId).broadcast.emit("hitesh", msg, username);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
      console.log(userId, "Disconnected");
    });
  });
});

app.get("/logout", function (req, res) {
  if (req.user) {
    console.log("Success logout", req.user);
    req.logOut();
    req.session.destroy(function (err) {
      res.redirect("/"); //Inside a callback… bulletproof!
    });
  } else {
    res.redirect("/");
  }
});

server.listen(3000, () => console.log("Server started on 3000"));