exports.view = function(moment, db){
  return function(req, res) {
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
  }
};

exports.upd = function(db) {
  return function(req, res) {
    req.db.posts.update({_id: db.ObjectID.createFromHexString(req.params.id)}, {$set: {
      body: req.body.post.body,
      title: req.body.post.title,
      m_date: new Date()}
    }, function(err, result) {
    if (err) throw err;
      res.redirect('post/id'+req.body.post.id);
    });
  }
};

exports.del = function(db) {
  return function(req, res) {
    req.db.comms.remove({post_id: req.params.id}, function(err, result) {
      if (err) throw err;
    });
    req.db.posts.remove({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, result) {
      if (err) throw err;
      res.redirect('/');
    });
  }
};

exports.creation = function(db) {
  return function(req, res){
    req.db.users.findOne({_id: db.ObjectID.createFromHexString(req.session.user_id)}, function(err, user) {
      res.render('new_post', {
        title: 'Tamidin`s blog: New post',
        blog_title: 'Новая запись',
        blog_descr: 'Заполни поля и сохрани:)',
        user: user
      });
    });
  }
};

exports.insert = function(req, res) {
  req.db.posts.insert({
    title: req.body.post.title,
    body: req.body.post.body,
    cr_date: new Date()
  }, function(err,result) {
    if (err) throw err;
    res.redirect('/');
  });
};

exports.edition = function(db) {
  return function(req, res){
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
  }
}