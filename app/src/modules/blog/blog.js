var fs = require('fs');
var mediator = require('../mediator/mediator');

module.exports = Blog;

function Blog() {
  var html = fs.readFileSync(__dirname + '/blog.html', 'utf8');
  this.$el = $(html);

  var self = this;

  mediator.subscribe('option-selected', function(args) {
    self.fetchBlog(args.date);
  });
}

Blog.prototype.appendTo = function(target) {
  $(target).append(this.$el);
};

Blog.prototype.fetchBlog = function(date) {
  console.log(date);
};