//Module dependencies.
var express = require('express'),
    moment = require("moment"),
    http = require('http'),
    path = require('path'),
    passport = require('passport'),
    LinkedInStrategy = require('passport-linkedin').Strategy,
    VKontakteStrategy = require('passport-vkontakte').Strategy;

var app = express();

// Configuration
app.use(express.cookieParser('crpt'));
app.use(express.session());
app.use(function(req, res, next) {
  res.locals._csrf = req.session._csrf;
  next();
});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + '/public'));
  app.use("/styles", express.static(__dirname + '/public/stylesheets'));
  app.use("/images", express.static(__dirname + '/public/images'));
  app.use(app.router);
});

//Routes
  var auth = require('./routes/auth');
  var post = require('./routes/post');
  var index = require('./routes/index');
  var comment = require('./routes/comment');
  var registration = require('./routes/registration');

//Checker
  var check = require('./check');

//Passport
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

//API-conf for login with vkontakte
passport.use(new VKontakteStrategy({
    clientID:     '4185104', // VK.com docs call it 'API ID'
    clientSecret: '1kNFQiBc0VCwEf39Uu7T',
    callbackURL:  "/auth/vkontakte/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

//API-conf for login with LinkedIn
passport.use(new LinkedInStrategy({
    consumerKey: "755o8jua672wwx",
    consumerSecret: "4CGBbBzN5zh1uYC2",
    callbackURL: "/auth/linkedin/callback"
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

// Routes
  //Authorization
    app.post('/auth', auth.enter);
    app.del('/auth', check.auth, auth.exit);
    //LinkedIn
      app.get('/auth/linkedin', passport.authenticate('linkedin'),function(req, res){});
      app.get('/auth/linkedin/callback', auth.linkedin(passport));
    //VK
      app.get('/auth/vkontakte', passport.authenticate('vkontakte'),function(req, res){});
      app.get('/auth/vkontakte/callback', auth.vkontakte(passport));
    //Login
      app.get('/login', check.nonAuth, auth.view);
    //Registration
      app.get('/registration', check.nonAuth, registration.view);
      app.post('/registration', check.nonAuth, registration.save);

  //index
   app.get('/', index.view(moment));

  //Post
    app.get('/post/id:id.:format?', post.view(moment));
    app.put('/post/id:id.:format?', check.admin, post.upd);
    app.delete('/post/id:id.:format?', check.admin, post.del);
    //Edit post
      app.get('/post/edit/id:id.:format?', check.admin, post.edition);
    //New post
      app.get('/post/new', check.admin, post.creation);
      app.post('/post/new', check.admin, post.insert);

  //Comment
    app.delete('/comm/:id.:format?', check.admin, comment.del);
    app.post('/comm/:id.:format?', check.auth, comment.insert);
//------------------------------------------------------------------------------

app.listen(80, function(){
  console.log("Express server listening on 80 port.");
});