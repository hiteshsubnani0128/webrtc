const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const {
  v4: uuidV4
} = require("uuid");
const User = require("./models/user");
const bodyParser = require("body-parser");
var session = require("express-session");
var mongoose = require("mongoose");
var passport = require("passport");
const controller = require("./controller/auth");
const Room = require("./models/room");
const request = require("request");
require("dotenv/config");

const DB = "mongodb://localhost:27017/sih";
// const DB =
//   "mongodb+srv://newuser:newuser@cluster0.um27o.mongodb.net/sihgov?retryWrites=true&w=majority";

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
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

function isAuth(req, res, next) {
  if (req.user) {
    res.redirect("back");
  } else {
    next();
  }
}

function isAuthIs(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect("back");
  }
}

app
  .get("/", (req, res) => {
    res.render("home", {
      user: req.user,
    });
  })
  .post("/", (req, res) => {
    res.redirect("/e/" + req.body.room);
  });

app.get("/adddata", (req, res) => {
  console.log(req.query);
});

app
  .get("/login", isAuth, (req, res) => {
    res.render("login");
  })
  .post("/login", controller.logMeIn);

app
  .get("/signup", isAuth, (req, res) => {
    res.render("signup", {
      user: false,
    });
  })
  .post("/signup", controller.signup);

// ====================== Socket IO =================================

app.get("/e/:room", (req, res) => {
  Room.findOne({
    roomName: req.params.room,
  }).then((room) => {
    if (!room) {
      var newUser = new Room({
        roomName: req.params.room,
      });
      Room.createRoom(newUser, (err, room) => {
        console.log(room);
        res.render("room", {
          roomId: req.params.room,
          user: req.user,
          room: room,
        });
      });
    } else {
      res.render("room", {
        roomId: req.params.room,
        user: req.user,
        room: room,
      });
    }
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("hitesh", (msg, roomId, username) => {
      let chat = [username, msg];

      Room.findOne({
        roomName: roomId,
      }).then((room) => {
        console.log(room);
      });

      Room.updateOne({
        roomName: roomId,
      }, {
        $push: {
          chat: [chat],
        },
      }).then((d) => {
        console.log(d);
      });

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

// DASHBOARD

app.get("/dashboard", isAuthIs, (req, res) => {
  User.findOne({
    username: req.user.username,
  }).then((user) => {
    console.log(user);
    res.render("dashboard", {
      user,
    });
  });
});

app.get("/trigger", isAuthIs, (req, res) => {
  User.findOne({
    username: req.user.username,
  }).then((user) => {
    console.log(user);
    res.render("triggers", {
      user,
    });
  });
});

app.get("/userdash", isAuthIs, (req, res) => {
  User.findOne({
    username: req.user.username,
  }).then((user) => {
    console.log(user);
    res.render("userdash", {
      user,
    });
  });
});


app.get("/:room/dashboard", (req, res) => {
  Room.findOne({
    roomName: req.params.id,
  }).then((room) => {
    console.log(room);
  });
});

app.get("/zoom", (req, res) => {
  // Step 1:
  // Check if the code parameter is in the url
  // if an authorization code is available, the user has most likely been redirected from Zoom OAuth
  // if not, the user needs to be redirected to Zoom OAuth to authorize

  if (req.query.code) {
    // Step 3:
    // Request an access token using the auth code

    let url =
      "https://zoom.us/oauth/token?grant_type=authorization_code&code=" +
      req.query.code +
      "&redirect_uri=" +
      process.env.redirectURL;

    request
      .post(url, (error, response, body) => {
        // Parse response to JSON
        body = JSON.parse(body);

        // Logs your access and refresh tokens in the browser
        console.log(body);
        console.log(`access_token: ${body.access_token}`);
        console.log(`refresh_token: ${body.refresh_token}`);

        if (body.access_token) {
          // Step 4:
          // We can now use the access token to authenticate API calls

          // Send a request to get your user information using the /me context
          // The `/me` context restricts an API call to the user the token belongs to
          // This helps make calls to user-specific endpoints instead of storing the userID

          request
            .get(
              " https://api.zoom.us/v2/users/hiteshsubnani75@gmail.com",
              (error, response, body) => {
                if (error) {
                  console.log("API Response Error: ", error);
                } else {
                  body = JSON.parse(body);
                  // Display response in console
                  console.log("API call ", body);
                }
              }
            )
            .auth(null, null, true, body.access_token);
        } else {
          // Handle errors, something's gone wrong!
        }
      })
      .auth(process.env.clientID, process.env.clientSecret);

    return;
  }

  // Step 2:
  // If no authorization code is available, redirect to Zoom OAuth to authorize
  res.redirect(
    "https://zoom.us/oauth/authorize?response_type=code&client_id=" +
    process.env.clientID +
    "&redirect_uri=" +
    process.env.redirectURL
  );
});

server.listen(3000, () => console.log("Server started on 3000"));