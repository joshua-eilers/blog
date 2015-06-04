var fs = require('fs');
var overlay = require('../overlay/overlay');
var MockAjax = require('../mock_ajax/mock_ajax');

module.exports = Comments;

function Comments(opts) {
  this.url = opts.url;
  this.$target = opts.$target;
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
  this.$target.append(html);
  var self = this;

  this.$target.find('.comments form').submit(function(e) {
    self.postComment(
      self.postId,
      self.$target.find('.comments form .add-comment-name').val(),
      self.$target.find('.comments form .add-comment-text').val()
    );
    return false;
  });
};

Comments.prototype.postComment = function(id, name, text) {
  var self = this;

  overlay.display();

  // use a custom mock ajax object, looks like $.ajax so easy to plugin to real library later
  var request = new MockAjax({
    type: 'post',
    url: this.url,
    data: { method: 'postComment', id: id, name: name, text: text },
    dataType: 'json'
  });

  request.done(function(response) {
    // self.insertComments(response);

    // prepend the nwe comment above the rest here
    // show overlay while saving the comment?
    // reset the text fields on succesfuly submission
    if (response.success) {
      console.log('success');
      overlay.remove();
    }
  });

  request.fail(function(response) {
    console.log('error');
    console.log(response);
    overlay.remove();
  });
};