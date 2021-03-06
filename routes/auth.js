var Model = require('../model');

exports.enter = function(req, res){
  new Model('users').find({login: req.body.user.login, password: req.body.user.pass}, function(err, user){
    if (user) {
      req.session.user_id = user._id;
      if (req.headers['referer']=='/auth')  res.redirect(req.headers['referer']); else  res.redirect('/');
    } else {
      res.render('login.jade', {
        er: 'Такого пользователя не существует или введенный пароль неверен.',
        title: 'Tamidin`s blog: Login', 
        login: req.body.user.login,
        blog_title: 'Авторизация'
      });
    }
  });
};

exports.exit = function(req, res) {
  req.session.destroy(function() {});
  res.redirect('/');
};

exports.view = function(req, res) {
  res.render('login.jade', {
    title: 'Tamidin`s blog: Login', 
    blog_title: 'Авторизация'
  });
};

exports.linkedin = function(passport) {
  return function(req, res, next) {
    passport.authenticate('linkedin',  { failureRedirect: '/' }, function(err, user, info) {
      if (!user || err) {
        res.render('login.jade', {
          er: 'Не удалось авторизоваться через LinkedIn.',
          title: 'Tamidin`s blog: Login', 
          blog_title: 'Авторизация'
        }); 
      } else {
        new Model('users').find({linkedin_id: user.id}, function(err, user){
          if (user) {
            req.session.user_id = user._id;
            res.redirect("/");
          } else {
            new Model('users').insert({
              linkedin_id: user.id,
              login: req.user.displayName,
              role: "user"
            }, function(err, result) {
              if (err) { console.log(err); };
            });
            new Model('users').find({linkedin_id: user.id}, function(err, user){
              req.session.user_id = user._id;
              res.redirect("/");
            });
          } 
        });
      }
    })(req, res, next);
  }
};

exports.vkontakte = function(passport) {
  return function(req, res, next) {
    passport.authenticate('vkontakte', function(err, user, info) {
      if (!user || err) { 
        res.render('login.jade', {
          er: 'Не удалось авторизоваться через VK.',
          title: 'Tamidin`s blog: Login', 
          blog_title: 'Авторизация'
        }); 
      } else {
        new Model('users').find({vkontakte_id: user.id}, function(err, l_user){
          if (l_user) {
            req.session.user_id=l_user._id;
            res.redirect("/");
          } else {
            new Model('users').insert({
              vkontakte_id: user.id,
              login: user.displayName,
              avatar: user.photos[0].value,
              role: "user"
            }, function(err, result) {
              if (err) { console.log(err); };
            });
            new Model('users').find({vkontakte_id: user.id}, function(err, l_user){
              req.session.user_id = l_user._id;
              res.redirect("/");
            });
          }
        });
      }
    })(req, res, next);
  }
};