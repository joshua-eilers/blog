var fs = require('fs');
var overlay = require('../overlay/overlay');
var MockAjax = require('../mock_ajax/mock_ajax');

module.exports = Comments;

function Comments(opts) {
  var html = $(fs.readFileSync(__dirname + '/comments.html', 'utf8'));
  this.$el = $(html);
  this.url = opts.url;
  this.$target = opts.$target;
  this.postId = opts.id;
  this.commentTemplate = _.template(fs.readFileSync(__dirname + '/comment.html', 'utf8'));

  this.fetchComments(this.postId);

  return this;
}

Comments.prototype.appendTo = function($target) {
  $target.append(this.$el);
};

Comments.prototype.fetchComments = function(id) {
  var self = this;

  overlay.display();

  // use a custom mock ajax object, looks like $.ajax so easy to plugin to real library later
  var request = new MockAjax({
    type: 'get',
    url: this.url,
    data: { method: 'fetchComments', id: id },
    dataType: 'json'
  });

  request.done(function(response) {
    self.insertComments(response);
    overlay.remove();
  });

  request.fail(function(response) {
    console.log('error');
    console.log(response);
    overlay.remove();
  });
};

Comments.prototype.insertComments = function(comments) {
  var html = "";
  var self = this;

  $.each(comments, function(i, comment) {
    html += self.commentTemplate({ comment: comment });
  });

  this.$el.find('.comments-list').append(html);

  this.$el.find('form .add-comment-text').keyup(function() {
    if ($(this).val().length) {
      self.$el.find('form .btn-primary.disabled').removeClass('disabled');
    } else {
      self.$el.find('form .btn-primary').addClass('disabled');
    }
  });

  this.$el.find('form').submit(function(e) {
    var $this = $(this);
    if (!$this.find('.add-comment-text').val().length) {
      return false;
    }

    self.postComment(
      self.postId,
      self.$el.find('form .add-comment-name').val(),
      self.$el.find('form .add-comment-text').val()
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
    if (response.success) {
      self.$el.find('.add-comment-text,.add-comment-name').val('');
      self.$el.find('.form .btn-primary').addClass('disabled');

      var html = self.commentTemplate({
        comment: {
          name: _.escape(name),
          timestamp: new Date().toLocaleTimeString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          text: _.escape(text)
        }
      });

      self.$el.find('.comments-list').prepend(html);
    }

    overlay.remove();
  });

  request.fail(function(response) {
    console.log('error');
    console.log(response);
    overlay.remove();
  });
};