
/**
 * Module dependencies.
 */

var express = require('express');
  //routes = require('./routes');
  var http = require('http');
  var moment = require("moment");
  var path = require('path');
  var mongoskin = require('mongoskin');
  var passport = require('passport');
  var LinkedInStrategy = require('passport-linkedin').Strategy;
  var VKontakteStrategy = require('passport-vkontakte').Strategy;
  var db = mongoskin.db('mongodb://localhost:27017/blog?auto_reconnect', {safe:true});

var app = module.exports = express();

// Configuration
app.use(function(req, res, next) {
  req.db = {};
  req.db.posts = db.collection('posts');
  req.db.users = db.collection('users');
  req.db.comms = db.collection('comms');
  next();
})

app.use(express.cookieParser('crpt'));
app.use(express.session());

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use("/styles", express.static(__dirname + '/public/stylesheets'));
  app.use("/images", express.static(__dirname + '/public/images'));
});

app.use(function(req, res, next) {
  res.locals._csrf = req.session._csrf;
  return next();
})

//API for auth

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

//API for login with vkontakte

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

app.get('/auth/vkontakte', passport.authenticate('vkontakte'),function(req, res){});

app.get('/auth/vkontakte/callback',
  passport.authenticate('vkontakte', { failureRedirect: '/' }), 
  function(req, res) {
  req.db.users.findOne({vkontakte_id: req.user.id}, function(err, user){
    if (user) {
      req.session.user_id=user._id;
      res.redirect("/");
    } else {
      db.collection('users').insert({
        vkontakte_id: req.user.id,
        login: req.user.displayName,
        role: "user"
      }, function(err,result) {
        if (err) throw err;
        if (result) {
        }
      });
      req.db.users.findOne({vkontakte_id: req.user.id}, function(err, user){
        req.session.user_id=user._id;
        res.redirect("/");
      });
    }
  });
});

//API for login with LinkedIn
var LINKEDIN_API_KEY = "755o8jua672wwx";
var LINKEDIN_SECRET_KEY = "4CGBbBzN5zh1uYC2";

passport.use(new LinkedInStrategy({
    consumerKey: LINKEDIN_API_KEY,
    consumerSecret: LINKEDIN_SECRET_KEY,
    callbackURL: "/auth/linkedin/callback"
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function () {
      // To keep the example simple, the user's LinkedIn profile is returned to
      // represent the logged-in user. In a typical application, you would want
      // to associate the LinkedIn account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

app.get('/auth/linkedin', passport.authenticate('linkedin'),function(req, res){});

app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/' }), 
  function(req, res) {
  req.db.users.findOne({linkedin_id: req.user.id}, function(err, user){
    if (user) {
      req.session.user_id=user._id;
      res.redirect("/");
    } else {
      db.collection('users').insert({
        linkedin_id: req.user.id,
        login: req.user.displayName,
        role: "user"
      }, function(err,result) {
        if (err) throw err;
        if (result) {
        }
      });
      req.db.users.findOne({linkedin_id: req.user.id}, function(err, user){
        req.session.user_id=user._id;
        res.redirect("/");
      });
    }
  });
});

// Routes
//Authorization
app.post('/auth', function(req, res){
  req.db.users.findOne({login: req.body.user.login, password: req.body.user.pass}, function(err, user){
    if (user) {
      req.session.user_id=user._id;
      res.redirect(req.headers['referer']);
    } else {
    res.redirect('/');
    }
  });
});

app.del('/auth', checkAuth, function(req, res) {
  if (req.session) {
    req.session.destroy(function() {});
  }
  res.redirect('/');
});

//Registration
app.get('/registration', checkNonAuth, function(req, res){
  if (req.session.user_id==null) {
    res.render('registration.jade', {
      title: 'Tamidin`s blog: Registration', 
      blog_title: 'Регистрация', 
      blog_descr: 'Позволит вам комментировать записи'
    });
  }
});

app.post('/registration', checkNonAuth, function(req, res) {
    db.collection('users').insert({
    login: req.body.user.login,
    password: req.body.user.pass,
    role: "user"
  }, function(err,result) {
        if (err) throw err;
    if (result) {
      res.redirect("/");
    }
  });
});

//index
app.get('/', function(req, res){
  req.db.posts.find().sort({$natural: -1}).toArray(function(err, posts){
      if (req.session.user_id) {req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
        if (user) {
          res.render('blog.jade', {
            title: 'Tamidin`s blog', 
            blog_title: 'Блог Тая ^_^', 
            blog_descr: 'В котором он учит nodejs', 
            moment: moment, 
            user: user, 
            posts: posts || []});
        } 
      });
    } else {
      res.render('blog.jade', {
        title: 'Tamidin`s blog', 
        blog_title: 'Блог Тая ^_^', 
        blog_descr: 'В котором он учит nodejs',
        moment: moment, 
        posts: posts || []});
    }
    console.log(req.user);
  });
});

//Post
app.get('/post/id:id.:format?', function(req, res){
  req.db.posts.findOne({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, post){
    req.db.comms.find({post_id: req.params.id}).toArray(function(err, comms){
      if (req.session.user_id) {
        req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
          if (user) {
            res.render('post.jade', {
              title: 'Tamidin`s blog: '+post.title,
              blog_title: post.title,
              blog_descr: moment(post.cr_date).format("DD MMM YYYY HH:mm"),
              moment: moment, 
              user: user, 
              post: post, 
              comms: comms});
          };
        });
      } else {
        res.render('post.jade', {
          title: 'Tamidin`s blog: '+post.title,
          blog_title: post.title,
          blog_descr: moment(post.cr_date).format("DD MMM YYYY HH:mm"),
          moment: moment, 
          post: post, 
          comms: comms
        });
      }
    });
  });
});

app.put('/post/id:id.:format?', checkAdmin, function(req, res) {
    req.db.posts.update({_id: db.ObjectID.createFromHexString(req.params.id)}, {$set: {
      body: req.body.post.body,
      title: req.body.post.title,
      m_date: new Date()
    }
    }, function(err, result) {
    if (err) throw err;
      res.redirect('post/id'+req.body.post.id);
    });
});

app.delete('/post/id:id.:format?', checkAdmin, function(req, res) {
  req.db.comms.remove({post_id: req.params.id}, function(err, result) {
    if (err) throw err;
    });
    req.db.posts.remove({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, result) {
    if (err) throw err;
    res.redirect('/');
    });
});

//Edit post
app.get('/post/edit/id:id.:format?', checkAdmin, function(req, res){
  req.db.posts.findOne({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, post){
    req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
      res.render('edit_post.jade', {
        title: 'Tamidin`s blog: Edit post #'+post._id,
        blog_title: 'Post #'+post._id,
        blog_descr: 'Редактирование поста',
        post: post, 
        user: user
      });
    });
  });
});

//New post
app.get('/post/new', checkAdmin, function(req, res){
  req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
    res.render('new_post', {
      title: 'Tamidin`s blog: New post',
      blog_title: 'Новая запись',
      blog_descr: 'Заполни поля и сохрани:)',
      user: user
    });
  });
});

app.post('/post/new', checkAdmin, function(req, res) {
  console.log(req.body.post.title);
    db.collection('posts').insert({
    title: req.body.post.title,
    body: req.body.post.body,
    cr_date: new Date()
  }, function(err,result) {
        if (err) throw err;
    res.redirect('/');
  });
});

//Comment
app.delete('/comm/:id.:format?', checkAdmin, function(req, res) {
  req.db.comms.remove({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, result) {
    if (err) throw err;
    res.redirect('post/id'+req.body.post.id);
    });
});

app.post('/comm/:id.:format?', checkAuth, function(req, res) {
  req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
    db.collection('comms').insert({
      post_id: req.body.post.id,
      author: user.login,
      body: req.body.comm.body,
      cr_date: new Date()
    }, function(err, result) {
      if (err) throw err;
      res.redirect('post/id'+req.body.post.id);
    });
  });
});



function checkAuth(req, res, next) {
  if (req.session.user_id) {
    req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/');
      }
    });
  } else {
    res.redirect('/');
  }
}

function checkNonAuth(req, res, next) {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    next();
  }
}

function checkAdmin(req, res, next) {
  if (req.session.user_id) {
    req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
      if (user.role=='admin') {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/');
      }
    });
  } else {
    res.redirect('/');
  }
}

app.listen(80, function(){
  console.log("Express server listening on port %d in %s mode", app.settings.env);
});
