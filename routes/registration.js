exports.view = function(req, res){
  res.render('registration.jade', {
    title: 'Tamidin`s blog: Registration', 
    blog_title: 'Регистрация'
  });
};

exports.save = function(db) {
  return function(req, res) {
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
  }
};