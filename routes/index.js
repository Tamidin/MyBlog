var Model = require('../model');

exports.view = function(moment){
  return function(req, res) {
    new Model('posts').getlist({}, {cr_date: -1}, function(err, posts){
      if (req.session.user_id) {new Model('users').find({_id: req.session.user_id}, function(err, user) {
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
    });
  }
};