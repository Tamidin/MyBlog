var Model = require('../model');

exports.view = function(moment) {
  return function(req, res) {
    new Model('users').find({_id: req.params.id}, function(err, user){
      new Model('comms').getlist({author: user.login}, {cr_date: -1}, function(err, comms){
        res.render('stat.jade', {
          title: 'Tamidin`s blog: '+user.login,
          blog_title: user.login,
          blog_descr: '...',
          moment: moment, 
          user: user, 
          comms: comms});
      });
    });
  }
};