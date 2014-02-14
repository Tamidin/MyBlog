exports.view = function(moment, db){
  return function(req, res) {
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
    });
  }
};