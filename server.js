const express = require('express');
const session = require('express-session');
const passport = require('passport');
const strategy = require('passport-42').Strategy;

const app = express();
const User = require('./models/user');

// configure express-session
app.use(session({
    secret: 'MY SO HARD SECRET KEY',
    resave: false,
    saveUninitialized: false
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// configure passport to use the strategy
passport.use(new strategy({
    clientID: '',
    clientSecret: '',
    callbackURL: 'http://localhost:3000/callback',
    scope: 'public'
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ uId: profile.id }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            user = new User({
                uId: profile.id,
                // other properties
            });
            user.save(function (err) {  
                if (err) {
                    return done(err);
                }
                return done(null, user);
            });
        } else {
            return done(null, user);
        }
    });
  }
));

// serialize and deserialize the user
passport.serializeUser(function(user, done) {
    done(null, user.uId);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// create a protected route
app.get('/secret', ensureAuthenticated, function(req, res) {
    res.send('This page is only accessible by logged in users');
});

// create an ensureAuthenticated middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
    return next();
}
    res.redirect('/login');
}

app.get('/login', passport.authenticate('42', { failureRedirect: '/login' }), function(req, res) {
    req.isAuthenticated = true;
    res.redirect('/secret');
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});