var fs = require('fs');
var MockAjax = require('../mock_ajax/mock_ajax');

module.exports = Comments;

function Comments(opts) {
  this.url = opts.url;
  this.$el = opts.$el;
  this.postId = opts.id;
  this.commentsTemplate = _.template(fs.readFileSync(__dirname + '/comments.html', 'utf8'));

  this.fetchComments(this.postId);

  return this;
}

Comments.prototype.fetchComments = function(id) {
  var self = this;

  // use a custom mock ajax object, looks like $.ajax so easy to plugin to real library later
  var request = new MockAjax({
    type: 'get',
    url: this.url,
    data: { method: 'fetchComments', id: id },
    dataType: 'json'
  });

  request.done(function(response) {
    self.insertComments(response);
  });

  request.fail(function(response) {
    console.log('error');
    console.log(response);
  });
};

Comments.prototype.insertComments = function(comments) {
  var html = this.commentsTemplate({ comments: comments });
  this.$el.append(html);
};
