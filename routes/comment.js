var Model = require('../model');

exports.insert = function(req, res) {
  new Model('users').find({_id: req.session.user_id}, function(err, user) {
    new Model('comms').insert({
      post_id: req.body.post.id,
      author: user.login,
      author_id: req.session.user_id,
      author_av: user.avatar,
      body: req.body.comm.body,
      cr_date: new Date()
    }, function(err, result) {
      if (err) throw err;
      res.redirect('post/id'+req.body.post.id);
    });
  });
};

exports.del = function(req, res) {
  new Model('comms').remove({_id: req.params.id}, function(err, result) {
    if (err) throw err;
    res.redirect('post/id'+req.body.post.id);
  });
};