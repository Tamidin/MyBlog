
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , posts = require('./routes/posts.js');
  var http = require('http');
var path = require('path');
  var mongoskin = require('mongoskin');
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
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


app.use(function(req, res, next) {
  res.locals._csrf = req.session._csrf;
  return next();
})


// Routes
app.post('/auth', function(req, res){
  req.db.users.findOne({login: req.body.user.login, password: req.body.user.pass}, function(err, user){
    if (user) {
      req.session.user_id=user._id;
    }
    console.log("");
    res.redirect('/');
  });
});

app.get('/auth2', loadUser, function(req, res) {
  // Удалить сессию
  if (req.session) {
    req.session.destroy(function() {});
  }
  res.redirect('/');
});

app.get('/registration', function(req, res){
  res.render('registration.jade');
});

app.post('/registration', function(req, res) {
    db.collection('users').insert({
    login: req.body.user.login,
    password: req.body.user.pass,
    role: "user"
  }, function(err,result) {
        if (err) throw err;
    if (result) {
      console.log();
      res.redirect("/");
    }
  });
});
  
app.get('/', function(req, res){
  req.db.posts.find().toArray(function(err, posts){
      if (req.session.user_id) {req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
        if (user) {
          res.render('blog.jade', {user: user, posts: posts || []});
        } 
      });
    } else {
      res.render('blog.jade', {posts: posts || []});
    }
    
    //console.log(posts);
  });
});

app.get('/post:id.:format?', function(req, res){
  req.db.posts.findOne({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, post){
    var comms = req.db.comms.findOne({}, function(err, result){return result;});
    console.log(comms);
      if (req.session.user_id) {req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
        if (user) {
          res.render('post.jade', {user: user, post: post, comms: comms});
        }
      });
      } else {
      res.render('post.jade', {post: post});
    }
    console.log(req.params.id);
    console.log(post);
  });
});

app.get('/add_post', loadUser, function(req, res){
  res.render('new_post')
});

app.post('/add_post', function(req, res) {
  // Находим документ
  console.log(req.body.post.title);
    db.collection('posts').insert({
    title: req.body.post.title,
    body: req.body.post.body,
    cr_date: new Date()
  }, function(err,result) {
        if (err) throw err;
    if (result) console.log();
  });
});

app.post('/add_comm:id.:format?', function(req, res) {
  // Находим документ
    db.collection('comms').insert({
    post_id: req.params.id,
    author: req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}).login,
    body: req.body.comm.body,
    cr_date: new Date()
  }, function(err,result) {
        if (err) throw err;
    if (result) console.log();
  });
});

function loadUser(req, res, next) {
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

app.listen(80, function(){
  console.log("Express server listening on port %d in %s mode", app.settings.env);
});
