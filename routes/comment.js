exports.insert = function(db){
  return function(req, res) {
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
  }
};

exports.del = function(db) {
  return function(req, res) {
  req.db.comms.remove({_id: db.ObjectID.createFromHexString(req.params.id)}, function(err, result) {
    if (err) throw err;
    res.redirect('post/id'+req.body.post.id);
    });
}
};