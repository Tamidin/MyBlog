exports.auth = function(db) {
  return function(req, res, next) {
    if (req.session.user_id) {
      req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
        if (user) {
          next();
        } else {
          res.render('login.jade', {
            er: 'Не удалось пройти авторизацию, попробуйте еще раз.',
            title: 'Tamidin`s blog: Login',
            blog_title: 'Авторизация'
        });
        req.session.destroy(function() {});
        }
      });
    } else {
      res.render('login.jade', {
        er: 'Вы должны быть авторизованы для доступа к этой странице.',
        title: 'Tamidin`s blog: Login', 
        blog_title: 'Авторизация'
      });
    }
  }
};

exports.nonAuth = function(req, res, next) {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    next();
  }
};

exports.admin = function(db) {
  return function(req, res, next) {
    if (req.session.user_id) {
      req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
        if (user && user.role=='admin') {
          next();
        } else {
          res.redirect('/');
        }
      });
    } else {
      res.redirect('/');
    }
  }
};