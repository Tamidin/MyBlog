
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , posts = require('./routes/posts.js');
  var http = require('http');
  var moment = require("moment");
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
//Authorization
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

//Registration
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

//index
app.get('/', function(req, res){
  req.db.posts.find().sort({$natural: -1}).toArray(function(err, posts){
      if (req.session.user_id) {req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
        if (user) {
          res.render('blog.jade', {moment: moment, user: user, posts: posts || []});
        } 
      });
    } else {
      res.render('blog.jade', {moment: moment, posts: posts || []});
    }
    //console.log(posts);
  });
});

//Post
app.get('/post/id:id.:format?', function(req, res){
  req.db.posts.findOne({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, post){
    req.db.comms.find({post_id: req.params.id}).toArray(function(err, comms){
      if (req.session.user_id) {
        req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
          if (user) {
            res.render('post.jade', {moment: moment, user: user, post: post, comms: comms});
          };
        });
      } else {
        res.render('post.jade', {moment: moment, post: post, comms: comms});
      }
    });
  });
});

app.put('/post/id:id.:format?', function(req, res) {
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

app.delete('/post/id:id.:format?', function(req, res) {
  req.db.comms.remove({post_id: req.params.id}, function(err, result) {
    if (err) throw err;
    });
    req.db.posts.remove({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, result) {
    if (err) throw err;
    res.redirect('/');
    });
});

//Edit post
app.get('/post/edit/id:id.:format?', loadUser, function(req, res){
  req.db.posts.findOne({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, post){
    res.render('edit_post.jade', {post: post});
  });
});

//New post
app.get('/post/new', loadUser, function(req, res){
  res.render('new_post')
});

app.post('/post/new', function(req, res) {
  // Находим документ
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
app.delete('/comm/:id.:format?', function(req, res) {
  req.db.comms.remove({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, result) {
    if (err) throw err;
    res.redirect('post/id'+req.body.post.id);
    });
});

app.post('/comm/:id.:format?', function(req, res) {
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
