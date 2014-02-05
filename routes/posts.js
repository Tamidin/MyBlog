
/*
 * GET home page.
 */


exports.add_post = function(req, res){
  res.render('new_post', { title: 'Добавить пост' })
};