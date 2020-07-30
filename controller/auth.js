const User = require("../models/user");

function signup(req, res) {
    User.findOne({
            email: req.body.email,
        },
        (err, user) => {
            if (err) throw err;
            if (user)
                res.render("signup", {
                    user: {
                        name: req.body.name,
                        email: req.body.email,
                    },
                    err: "email",
                });
            else {
                let username =
                    req.body.email.split("@")[0].toLocaleLowerCase() +
                    Math.floor(1000 + Math.random() * 9000);
                // secretToken = randomstring.generate();
                console.log(req.body);
                if (req.body.password == "") {
                    res.render("signup", {
                        user: false,
                        err: "password",
                    });
                } else {
                    var newUser = new User({
                        email: req.body.email.toLocaleLowerCase(),
                        username: username,
                        password: req.body.password,
                        userType: "innovator",
                    });
                    User.createUser(newUser, function (err, user) {
                        if (err) {
                            res.render("signup", {
                                user: {
                                    name: req.body.name,
                                    email: req.body.email,
                                },
                                err: "email",
                            });
                        } else if (user) {
                            console.log(user);
                            req.login({
                                    username: user.username,
                                    uType: user.uType,
                                    id: user.id
                                },
                                function (err) {
                                    if (err) throw err;
                                    req.session.cookie.maxAge = 10 * 24 * 60 * 60 * 1000;
                                    res.redirect("/");
                                }
                            );
                        }
                    });
                }
            }
        }
    );
}

module.exports = {
    signup,
};