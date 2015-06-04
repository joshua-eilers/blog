var fs = require('fs');
var mediator = require('../mediator/mediator');
var MockAjax = require('../mock_ajax/mock_ajax');
var Comments = require('../comments/comments');

module.exports = Blog;

function Blog(opts) {
  var html = fs.readFileSync(__dirname + '/blog.html', 'utf8');
  this.$el = $(html);
  this.url = opts.url;
  this.postsTemplate = _.template(fs.readFileSync(__dirname + '/posts.html', 'utf8'));

  var self = this;

  mediator.subscribe('option-selected', function(args) {
    self.fetchBlog(args.date);
  });
}

Blog.prototype.appendTo = function(target) {
  $(target).append(this.$el);
};

Blog.prototype.fetchBlog = function(date) {
  var self = this;

  // use a custom mock ajax object, looks like $.ajax so easy to plugin to real library later
  var request = new MockAjax({
    type: 'get',
    url: this.url,
    data: { method: 'fetchBlog', date: date },
    dataType: 'json'
  });

  request.done(function(response) {
    self.setDate(response.date);
    self.insertPosts(response.posts);
  });

  request.fail(function(response) {
    console.log('error');
    console.log(response);
  });
};

Blog.prototype.setDate = function(date) {
  this.$el.find('h1 > small').html(date);
};

Blog.prototype.insertPosts = function(posts) {
  var html = this.postsTemplate({ posts: posts });
  this.$el.find('.posts').html(html);

  this.$el.find('.btn-read-more').click(function() {
    var $this = $(this);
    var $comments = $this.siblings('.post-comments-container');
    
    $this.siblings('.post-text').removeClass('trunc');

    new Comments({
      url: null,
      $target: $comments,
      id: $this.siblings('.post-id').val()
    }).appendTo($comments);
    
    $comments.show();

    $this.remove();
  });
};