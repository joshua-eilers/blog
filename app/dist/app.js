(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var mediator = require('./modules/mediator/mediator');
var overlay = require('./modules/overlay/overlay');
var Sidebar = require('./modules/sidebar/sidebar');
var Blog = require('./modules/blog/blog');

var applicationStart = function() {
  // setup initial page skeleton
  var html = "<div id=\"overlay\">\n  <div id=\"loaderImage\"></div>\n</div>\n<div class=\"container-fluid\">\n  <div class=\"row\">\n    <div id=\"sidebar-container\" class=\"col-xs-3 col-md-3 col-lg-2\"></div>\n    <div id=\"blog-container\" class=\"col-xs-offset-3 col-xs-9 col-md-offset-3 col-md-8 col-lg-offset-2 col-lg-10\"></div>\n  </div>\n</div>";
  $('#main-page-content').html(html);

  // instantiate modules
  var sidebar = new Sidebar({ url: null });
  var blog = new Blog({ url: null });

  overlay.setConfig({
    src: 'lib/images/loading.png',
    width: 150,
    height: 150,
    img: $("#loaderImage"),
    overlay: $("#overlay"),
    frames: 12,
    interval: 90
  });

  // display the modules
  sidebar.appendTo('#sidebar-container');
  blog.appendTo('#blog-container');

  mediator.publish('page-init', {});
};

$(document).ready(applicationStart);
},{"./modules/blog/blog":2,"./modules/mediator/mediator":4,"./modules/overlay/overlay":6,"./modules/sidebar/sidebar":7}],2:[function(require,module,exports){

var mediator = require('../mediator/mediator');
var overlay = require('../overlay/overlay');
var MockAjax = require('../mock_ajax/mock_ajax');
var Comments = require('../comments/comments');

module.exports = Blog;

function Blog(opts) {
  var html = "<div class=\"blog\">\n  <h1 class=\"page-header\">Blog <small></small></h1>\n  <div class=\"posts\"></div>\n</div>";
  this.$el = $(html);
  this.url = opts.url;
  this.postsTemplate = _.template("<% _.each(posts, function(post) { %>\n  <div class=\"post\">\n    <h2 class=\"post-title\"><%= post.title %></h2>\n    <div class=\"post-time\"><span class=\"glyphicon glyphicon-time\"></span> <%= post.timestamp %></div>\n    <br>\n    <div class=\"post-text trunc\"><%= post.text %></div>\n    <input class=\"post-id\" type=\"hidden\" value=\"<%= post.id %>\">\n    <div class=\"post-comments-container\">\n      <hr>\n    </div>\n    <button class=\"btn btn-primary btn-read-more\">Read more</button>\n  </div>\n  <br>\n<% }); %>");

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

  overlay.display();

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
    overlay.remove();
  });

  request.fail(function(response) {
    console.log('error');
    console.log(response);
    overlay.remove();
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
},{"../comments/comments":3,"../mediator/mediator":4,"../mock_ajax/mock_ajax":5,"../overlay/overlay":6}],3:[function(require,module,exports){

var overlay = require('../overlay/overlay');
var MockAjax = require('../mock_ajax/mock_ajax');

module.exports = Comments;

function Comments(opts) {
  var html = $("<div class=\"comments\">\n  <div class=\"well\">\n    <h4>Add a comment:</h4>\n    <form class=\"form\">\n      <div class=\"form-group\">\n        <input class=\"form-control add-comment-name\" placeholder=\"Name\">\n      </div>\n      <div class=\"form-group \">\n        <textarea class=\"form-control add-comment-text\" placeholder=\"Comment here...\" rows=\"3\"></textarea>\n      </div>\n      <button type=\"submit\" class=\"btn btn-primary btn-sm disabled\">Submit</button>\n    </form>\n  </div>\n  <hr>\n  <div class=\"comments-list\" style=\"display: block;\">\n  </div>\n</div>");
  this.$el = $(html);
  this.url = opts.url;
  this.$target = opts.$target;
  this.postId = opts.id;
  this.commentTemplate = _.template("<div class=\"comment\">\n  <div>\n    <img class=\"pull-left\" src=\"lib/images/placeholder.png\">\n    <h4><%= comment.name.length ? comment.name : 'Anonymous' %> <small class=\"pull-right\"><%= comment.timestamp %></small></h4>\n  </div>\n  <span class=\"comment-text\">\n    <%= comment.text %>\n  </span>\n</div>\n<br>\n<br>");

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
      var html = self.commentTemplate({ comment: { name: name, timestamp: 'June 2 2015 at 4:00 PM', text: text } });
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
},{"../mock_ajax/mock_ajax":5,"../overlay/overlay":6}],4:[function(require,module,exports){
// instantiate Mediator here, * singleton *
module.exports = new Mediator();

function Mediator() {
  this.events = {};
  return this;
}

Mediator.prototype.publish = function(msg, data) {
  if (this.events[msg]) {
    for (var i = 0, l = this.events[msg].length; i < l; i++) {
      this.events[msg][i](data);
    }
  }
};

Mediator.prototype.subscribe = function(msg, f) {
  if (!this.events[msg]) {
    this.events[msg] = [];
  }

  this.events[msg].push(f);
};

},{}],5:[function(require,module,exports){


module.exports = MockAjax;

function MockAjax(opts) {
  this.opts = opts;
  this.response = null;
  this.donePromise = null;
  this.failPromise = null;

  var self = this;
  var jsonString = "";

  // this part is just to bring in mock data depending on the request
  if (this.opts.data.method == 'fetchOptions') {
    jsonString = "[\n  \"June 2015\",\n  \"May 2015\",\n  \"April 2015\",\n  \"March 2015\",\n  \"February 2015\",\n  \"January 2015\"\n]";
  } else if (this.opts.data.method == 'fetchBlog') {
    if (this.opts.data.date == 'June 2015') {
      jsonString = "{\n  \"date\": \"June 2015\",\n  \"posts\": [\n    {\n      \"id\": 6,\n      \"title\": \"The great post\",\n      \"timestamp\": \"June 1, 2015 at 3:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    },\n    {\n      \"id\": 7,\n      \"title\": \"The second great post\",\n      \"timestamp\": \"June 1, 2015 at 4:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    },\n    {\n      \"id\": 8,\n      \"title\": \"The third great post\",\n      \"timestamp\": \"June 1, 2015 at 5:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    } else if (this.opts.data.date == 'May 2015') {
      jsonString = "{\n  \"date\": \"May 2015\",\n  \"posts\": [\n    {\n      \"id\": 5,\n      \"title\": \"The great post\",\n      \"timestamp\": \"May 1, 2015 at 3:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    } else if (this.opts.data.date == 'April 2015') {
      jsonString = "{\n  \"date\": \"April 2015\",\n  \"posts\": [\n    {\n      \"id\": 4,\n      \"title\": \"The great post\",\n      \"timestamp\": \"April 1, 2015 at 3:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    } else if (this.opts.data.date == 'March 2015') {
      jsonString = "{\n  \"date\": \"March 2015\",\n  \"posts\": [\n    {\n      \"id\": 3,\n      \"title\": \"The great post\",\n      \"timestamp\": \"March 1, 2015 at 3:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    } else if (this.opts.data.date == 'February 2015') {
      jsonString = "{\n  \"date\": \"February 2015\",\n  \"posts\": [\n    {\n      \"id\": 2,\n      \"title\": \"The great post\",\n      \"timestamp\": \"February 1, 2015 at 3:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    } else if (this.opts.data.date == 'January 2015') {
      jsonString = "{\n  \"date\": \"January 2015\",\n  \"posts\": [\n    {\n      \"id\": 1,\n      \"title\": \"The great post\",\n      \"timestamp\": \"January 1, 2015 at 3:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    }
  } else if (this.opts.data.method == 'fetchComments') {
    jsonString = "[\n  {\n    \"name\": \"This guy\",\n    \"timestamp\": \"June 2 2015 at 4:00 PM\",\n    \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet.\"\n  },\n  {\n    \"name\": \"That guy\",\n    \"timestamp\": \"June 2 2015 at 4:00 PM\",\n    \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet.\"\n  }\n  ,\n  {\n    \"name\": \"Final guy\",\n    \"timestamp\": \"June 2 2015 at 4:00 PM\",\n    \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet.\"\n  }\n]";
  } else if (this.opts.data.method == 'postComment') {
    jsonString = "{\n  \"success\": true\n}";
  }

  this.response = JSON.parse(jsonString);

  // set timer to run this.donePromise after some timeout, simulate a network delay
  setTimeout(function() {
    if (self.donePromise) {
      self.donePromise(self.response);
    }
  }, 200);

  return this;
}

MockAjax.prototype.done = function(f) {
  this.donePromise = f;
};

MockAjax.prototype.fail = function(f) {
  this.failPromise = f;
};
},{}],6:[function(require,module,exports){
module.exports = new Overlay();

function Overlay() {
  this.timer = null;
  this.image = null;
  this.height = 0;
  this.width = 0;
  this.$img = null;
  this.frames = 0;
  this.interval = 0;
  this.x = 0;
  this.index = 0;
}

Overlay.prototype.setConfig = function(args) {
  this.timer = null;
  this.height = args.height;
  this.width = args.width;
  this.$img = args.img;
  this.$overlay = args.overlay;
  this.frames = args.frames;
  this.interval = args.interval;
  this.x = 0;
  this.index = 0;
  this.image = new Image();
  this.image.src = args.src;
  this.$img.css('backgroundImage', 'url(' + this.image.src + ')');
  this.$img.width(this.width + 'px');
  this.$img.height(this.height + 'px');
};

Overlay.prototype.display = function() {
  // show the overlay
  if (this.timer === null) {
    this.animate();
    this.$overlay.show();
  }
};

Overlay.prototype.remove = function() {
  // hide the overlay
  this.$overlay.hide();
  clearTimeout(this.timer);
  this.timer = null;
  this.x = 0;
  this.index = 0;
};

Overlay.prototype.animate = function() {
  this.$img.css('backgroundPosition', this.x + 'px 0');
  this.x -= this.width;
  this.index++;

  if (this.index >= this.frames) {
    this.x = 0;
    this.index = 0;
  }

  var self = this;

  this.timer = setTimeout(function() {
    self.animate();
  }, this.interval);
};
},{}],7:[function(require,module,exports){

var mediator = require('../mediator/mediator');
var MockAjax = require('../mock_ajax/mock_ajax');

module.exports = Sidebar;

function Sidebar(opts) {
  var html = "<div class=\"sidebar\">\n   <ul></ul>\n   <hr>\n</div>\n";
  this.$el = $(html);
  this.elementsTemplate = _.template("<% _.each(elements, function(el, i) { %>\n  <li<%= i == 0 ? ' class=\"active\"' : '' %>>\n    <a href=\"javascript: void(0);\"><%= el %></a>\n  </li>\n<% }); %>\n");
  this.url = opts.url;

  var self = this;

  mediator.subscribe('page-init', function() {  
    self.fetchOptions();
  });

  return this;
}

Sidebar.prototype.appendTo = function(target) {
  $(target).append(this.$el);
};

Sidebar.prototype.fetchOptions = function() {
  var self = this;

  // use a custom mock ajax object, looks like $.ajax so easy to plugin to real library later
  var request = new MockAjax({
    type: 'get',
    url: this.url,
    data: { method: 'fetchOptions' },
    dataType: 'json'
  });

  request.done(function(response) {
    self.insertOptions(response);
    mediator.publish('option-selected', { date: response[0] });
  });

  request.fail(function(response) {
    console.log('error');
    console.log(response);
  });
};

Sidebar.prototype.insertOptions = function(options) {
  var $ul = this.$el.find('ul');
  $ul.append(this.elementsTemplate({ elements: options }));

  var self = this;

  $ul.find('a').click(function() {
    var $a = $(this);
    var $parent = $a.parent();

    if ($parent.hasClass('active')) {
      return;
    }

    self.$el.find('li.active').removeClass('active');
    $parent.addClass('active');
    mediator.publish('option-selected', { date: $a.text() });
  });
};
},{"../mediator/mediator":4,"../mock_ajax/mock_ajax":5}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc3JjL21haW4uanMiLCJhcHAvc3JjL21vZHVsZXMvYmxvZy9ibG9nLmpzIiwiYXBwL3NyYy9tb2R1bGVzL2NvbW1lbnRzL2NvbW1lbnRzLmpzIiwiYXBwL3NyYy9tb2R1bGVzL21lZGlhdG9yL21lZGlhdG9yLmpzIiwiYXBwL3NyYy9tb2R1bGVzL21vY2tfYWpheC9tb2NrX2FqYXguanMiLCJhcHAvc3JjL21vZHVsZXMvb3ZlcmxheS9vdmVybGF5LmpzIiwiYXBwL3NyYy9tb2R1bGVzL3NpZGViYXIvc2lkZWJhci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbnZhciBtZWRpYXRvciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9tZWRpYXRvci9tZWRpYXRvcicpO1xudmFyIG92ZXJsYXkgPSByZXF1aXJlKCcuL21vZHVsZXMvb3ZlcmxheS9vdmVybGF5Jyk7XG52YXIgU2lkZWJhciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9zaWRlYmFyL3NpZGViYXInKTtcbnZhciBCbG9nID0gcmVxdWlyZSgnLi9tb2R1bGVzL2Jsb2cvYmxvZycpO1xuXG52YXIgYXBwbGljYXRpb25TdGFydCA9IGZ1bmN0aW9uKCkge1xuICAvLyBzZXR1cCBpbml0aWFsIHBhZ2Ugc2tlbGV0b25cbiAgdmFyIGh0bWwgPSBcIjxkaXYgaWQ9XFxcIm92ZXJsYXlcXFwiPlxcbiAgPGRpdiBpZD1cXFwibG9hZGVySW1hZ2VcXFwiPjwvZGl2PlxcbjwvZGl2PlxcbjxkaXYgY2xhc3M9XFxcImNvbnRhaW5lci1mbHVpZFxcXCI+XFxuICA8ZGl2IGNsYXNzPVxcXCJyb3dcXFwiPlxcbiAgICA8ZGl2IGlkPVxcXCJzaWRlYmFyLWNvbnRhaW5lclxcXCIgY2xhc3M9XFxcImNvbC14cy0zIGNvbC1tZC0zIGNvbC1sZy0yXFxcIj48L2Rpdj5cXG4gICAgPGRpdiBpZD1cXFwiYmxvZy1jb250YWluZXJcXFwiIGNsYXNzPVxcXCJjb2wteHMtb2Zmc2V0LTMgY29sLXhzLTkgY29sLW1kLW9mZnNldC0zIGNvbC1tZC04IGNvbC1sZy1vZmZzZXQtMiBjb2wtbGctMTBcXFwiPjwvZGl2PlxcbiAgPC9kaXY+XFxuPC9kaXY+XCI7XG4gICQoJyNtYWluLXBhZ2UtY29udGVudCcpLmh0bWwoaHRtbCk7XG5cbiAgLy8gaW5zdGFudGlhdGUgbW9kdWxlc1xuICB2YXIgc2lkZWJhciA9IG5ldyBTaWRlYmFyKHsgdXJsOiBudWxsIH0pO1xuICB2YXIgYmxvZyA9IG5ldyBCbG9nKHsgdXJsOiBudWxsIH0pO1xuXG4gIG92ZXJsYXkuc2V0Q29uZmlnKHtcbiAgICBzcmM6ICdsaWIvaW1hZ2VzL2xvYWRpbmcucG5nJyxcbiAgICB3aWR0aDogMTUwLFxuICAgIGhlaWdodDogMTUwLFxuICAgIGltZzogJChcIiNsb2FkZXJJbWFnZVwiKSxcbiAgICBvdmVybGF5OiAkKFwiI292ZXJsYXlcIiksXG4gICAgZnJhbWVzOiAxMixcbiAgICBpbnRlcnZhbDogOTBcbiAgfSk7XG5cbiAgLy8gZGlzcGxheSB0aGUgbW9kdWxlc1xuICBzaWRlYmFyLmFwcGVuZFRvKCcjc2lkZWJhci1jb250YWluZXInKTtcbiAgYmxvZy5hcHBlbmRUbygnI2Jsb2ctY29udGFpbmVyJyk7XG5cbiAgbWVkaWF0b3IucHVibGlzaCgncGFnZS1pbml0Jywge30pO1xufTtcblxuJChkb2N1bWVudCkucmVhZHkoYXBwbGljYXRpb25TdGFydCk7IiwiXG52YXIgbWVkaWF0b3IgPSByZXF1aXJlKCcuLi9tZWRpYXRvci9tZWRpYXRvcicpO1xudmFyIG92ZXJsYXkgPSByZXF1aXJlKCcuLi9vdmVybGF5L292ZXJsYXknKTtcbnZhciBNb2NrQWpheCA9IHJlcXVpcmUoJy4uL21vY2tfYWpheC9tb2NrX2FqYXgnKTtcbnZhciBDb21tZW50cyA9IHJlcXVpcmUoJy4uL2NvbW1lbnRzL2NvbW1lbnRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmxvZztcblxuZnVuY3Rpb24gQmxvZyhvcHRzKSB7XG4gIHZhciBodG1sID0gXCI8ZGl2IGNsYXNzPVxcXCJibG9nXFxcIj5cXG4gIDxoMSBjbGFzcz1cXFwicGFnZS1oZWFkZXJcXFwiPkJsb2cgPHNtYWxsPjwvc21hbGw+PC9oMT5cXG4gIDxkaXYgY2xhc3M9XFxcInBvc3RzXFxcIj48L2Rpdj5cXG48L2Rpdj5cIjtcbiAgdGhpcy4kZWwgPSAkKGh0bWwpO1xuICB0aGlzLnVybCA9IG9wdHMudXJsO1xuICB0aGlzLnBvc3RzVGVtcGxhdGUgPSBfLnRlbXBsYXRlKFwiPCUgXy5lYWNoKHBvc3RzLCBmdW5jdGlvbihwb3N0KSB7ICU+XFxuICA8ZGl2IGNsYXNzPVxcXCJwb3N0XFxcIj5cXG4gICAgPGgyIGNsYXNzPVxcXCJwb3N0LXRpdGxlXFxcIj48JT0gcG9zdC50aXRsZSAlPjwvaDI+XFxuICAgIDxkaXYgY2xhc3M9XFxcInBvc3QtdGltZVxcXCI+PHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tdGltZVxcXCI+PC9zcGFuPiA8JT0gcG9zdC50aW1lc3RhbXAgJT48L2Rpdj5cXG4gICAgPGJyPlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJwb3N0LXRleHQgdHJ1bmNcXFwiPjwlPSBwb3N0LnRleHQgJT48L2Rpdj5cXG4gICAgPGlucHV0IGNsYXNzPVxcXCJwb3N0LWlkXFxcIiB0eXBlPVxcXCJoaWRkZW5cXFwiIHZhbHVlPVxcXCI8JT0gcG9zdC5pZCAlPlxcXCI+XFxuICAgIDxkaXYgY2xhc3M9XFxcInBvc3QtY29tbWVudHMtY29udGFpbmVyXFxcIj5cXG4gICAgICA8aHI+XFxuICAgIDwvZGl2PlxcbiAgICA8YnV0dG9uIGNsYXNzPVxcXCJidG4gYnRuLXByaW1hcnkgYnRuLXJlYWQtbW9yZVxcXCI+UmVhZCBtb3JlPC9idXR0b24+XFxuICA8L2Rpdj5cXG4gIDxicj5cXG48JSB9KTsgJT5cIik7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIG1lZGlhdG9yLnN1YnNjcmliZSgnb3B0aW9uLXNlbGVjdGVkJywgZnVuY3Rpb24oYXJncykge1xuICAgIHNlbGYuZmV0Y2hCbG9nKGFyZ3MuZGF0ZSk7XG4gIH0pO1xufVxuXG5CbG9nLnByb3RvdHlwZS5hcHBlbmRUbyA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAkKHRhcmdldCkuYXBwZW5kKHRoaXMuJGVsKTtcbn07XG5cbkJsb2cucHJvdG90eXBlLmZldGNoQmxvZyA9IGZ1bmN0aW9uKGRhdGUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIG92ZXJsYXkuZGlzcGxheSgpO1xuXG4gIC8vIHVzZSBhIGN1c3RvbSBtb2NrIGFqYXggb2JqZWN0LCBsb29rcyBsaWtlICQuYWpheCBzbyBlYXN5IHRvIHBsdWdpbiB0byByZWFsIGxpYnJhcnkgbGF0ZXJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgTW9ja0FqYXgoe1xuICAgIHR5cGU6ICdnZXQnLFxuICAgIHVybDogdGhpcy51cmwsXG4gICAgZGF0YTogeyBtZXRob2Q6ICdmZXRjaEJsb2cnLCBkYXRlOiBkYXRlIH0sXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICB9KTtcblxuICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBzZWxmLnNldERhdGUocmVzcG9uc2UuZGF0ZSk7XG4gICAgc2VsZi5pbnNlcnRQb3N0cyhyZXNwb25zZS5wb3N0cyk7XG4gICAgb3ZlcmxheS5yZW1vdmUoKTtcbiAgfSk7XG5cbiAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yJyk7XG4gICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgIG92ZXJsYXkucmVtb3ZlKCk7XG4gIH0pO1xufTtcblxuQmxvZy5wcm90b3R5cGUuc2V0RGF0ZSA9IGZ1bmN0aW9uKGRhdGUpIHtcbiAgdGhpcy4kZWwuZmluZCgnaDEgPiBzbWFsbCcpLmh0bWwoZGF0ZSk7XG59O1xuXG5CbG9nLnByb3RvdHlwZS5pbnNlcnRQb3N0cyA9IGZ1bmN0aW9uKHBvc3RzKSB7XG4gIHZhciBodG1sID0gdGhpcy5wb3N0c1RlbXBsYXRlKHsgcG9zdHM6IHBvc3RzIH0pO1xuICB0aGlzLiRlbC5maW5kKCcucG9zdHMnKS5odG1sKGh0bWwpO1xuXG4gIHRoaXMuJGVsLmZpbmQoJy5idG4tcmVhZC1tb3JlJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICB2YXIgJGNvbW1lbnRzID0gJHRoaXMuc2libGluZ3MoJy5wb3N0LWNvbW1lbnRzLWNvbnRhaW5lcicpO1xuICAgIFxuICAgICR0aGlzLnNpYmxpbmdzKCcucG9zdC10ZXh0JykucmVtb3ZlQ2xhc3MoJ3RydW5jJyk7XG5cbiAgICBuZXcgQ29tbWVudHMoe1xuICAgICAgdXJsOiBudWxsLFxuICAgICAgJHRhcmdldDogJGNvbW1lbnRzLFxuICAgICAgaWQ6ICR0aGlzLnNpYmxpbmdzKCcucG9zdC1pZCcpLnZhbCgpXG4gICAgfSkuYXBwZW5kVG8oJGNvbW1lbnRzKTtcbiAgICBcbiAgICAkY29tbWVudHMuc2hvdygpO1xuXG4gICAgJHRoaXMucmVtb3ZlKCk7XG4gIH0pO1xufTsiLCJcbnZhciBvdmVybGF5ID0gcmVxdWlyZSgnLi4vb3ZlcmxheS9vdmVybGF5Jyk7XG52YXIgTW9ja0FqYXggPSByZXF1aXJlKCcuLi9tb2NrX2FqYXgvbW9ja19hamF4Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWVudHM7XG5cbmZ1bmN0aW9uIENvbW1lbnRzKG9wdHMpIHtcbiAgdmFyIGh0bWwgPSAkKFwiPGRpdiBjbGFzcz1cXFwiY29tbWVudHNcXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwid2VsbFxcXCI+XFxuICAgIDxoND5BZGQgYSBjb21tZW50OjwvaDQ+XFxuICAgIDxmb3JtIGNsYXNzPVxcXCJmb3JtXFxcIj5cXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwXFxcIj5cXG4gICAgICAgIDxpbnB1dCBjbGFzcz1cXFwiZm9ybS1jb250cm9sIGFkZC1jb21tZW50LW5hbWVcXFwiIHBsYWNlaG9sZGVyPVxcXCJOYW1lXFxcIj5cXG4gICAgICA8L2Rpdj5cXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIFxcXCI+XFxuICAgICAgICA8dGV4dGFyZWEgY2xhc3M9XFxcImZvcm0tY29udHJvbCBhZGQtY29tbWVudC10ZXh0XFxcIiBwbGFjZWhvbGRlcj1cXFwiQ29tbWVudCBoZXJlLi4uXFxcIiByb3dzPVxcXCIzXFxcIj48L3RleHRhcmVhPlxcbiAgICAgIDwvZGl2PlxcbiAgICAgIDxidXR0b24gdHlwZT1cXFwic3VibWl0XFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1zbSBkaXNhYmxlZFxcXCI+U3VibWl0PC9idXR0b24+XFxuICAgIDwvZm9ybT5cXG4gIDwvZGl2PlxcbiAgPGhyPlxcbiAgPGRpdiBjbGFzcz1cXFwiY29tbWVudHMtbGlzdFxcXCIgc3R5bGU9XFxcImRpc3BsYXk6IGJsb2NrO1xcXCI+XFxuICA8L2Rpdj5cXG48L2Rpdj5cIik7XG4gIHRoaXMuJGVsID0gJChodG1sKTtcbiAgdGhpcy51cmwgPSBvcHRzLnVybDtcbiAgdGhpcy4kdGFyZ2V0ID0gb3B0cy4kdGFyZ2V0O1xuICB0aGlzLnBvc3RJZCA9IG9wdHMuaWQ7XG4gIHRoaXMuY29tbWVudFRlbXBsYXRlID0gXy50ZW1wbGF0ZShcIjxkaXYgY2xhc3M9XFxcImNvbW1lbnRcXFwiPlxcbiAgPGRpdj5cXG4gICAgPGltZyBjbGFzcz1cXFwicHVsbC1sZWZ0XFxcIiBzcmM9XFxcImxpYi9pbWFnZXMvcGxhY2Vob2xkZXIucG5nXFxcIj5cXG4gICAgPGg0PjwlPSBjb21tZW50Lm5hbWUubGVuZ3RoID8gY29tbWVudC5uYW1lIDogJ0Fub255bW91cycgJT4gPHNtYWxsIGNsYXNzPVxcXCJwdWxsLXJpZ2h0XFxcIj48JT0gY29tbWVudC50aW1lc3RhbXAgJT48L3NtYWxsPjwvaDQ+XFxuICA8L2Rpdj5cXG4gIDxzcGFuIGNsYXNzPVxcXCJjb21tZW50LXRleHRcXFwiPlxcbiAgICA8JT0gY29tbWVudC50ZXh0ICU+XFxuICA8L3NwYW4+XFxuPC9kaXY+XFxuPGJyPlxcbjxicj5cIik7XG5cbiAgdGhpcy5mZXRjaENvbW1lbnRzKHRoaXMucG9zdElkKTtcblxuICByZXR1cm4gdGhpcztcbn1cblxuQ29tbWVudHMucHJvdG90eXBlLmFwcGVuZFRvID0gZnVuY3Rpb24oJHRhcmdldCkge1xuICAkdGFyZ2V0LmFwcGVuZCh0aGlzLiRlbCk7XG59O1xuXG5Db21tZW50cy5wcm90b3R5cGUuZmV0Y2hDb21tZW50cyA9IGZ1bmN0aW9uKGlkKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBvdmVybGF5LmRpc3BsYXkoKTtcblxuICAvLyB1c2UgYSBjdXN0b20gbW9jayBhamF4IG9iamVjdCwgbG9va3MgbGlrZSAkLmFqYXggc28gZWFzeSB0byBwbHVnaW4gdG8gcmVhbCBsaWJyYXJ5IGxhdGVyXG4gIHZhciByZXF1ZXN0ID0gbmV3IE1vY2tBamF4KHtcbiAgICB0eXBlOiAnZ2V0JyxcbiAgICB1cmw6IHRoaXMudXJsLFxuICAgIGRhdGE6IHsgbWV0aG9kOiAnZmV0Y2hDb21tZW50cycsIGlkOiBpZCB9LFxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgfSk7XG5cbiAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgc2VsZi5pbnNlcnRDb21tZW50cyhyZXNwb25zZSk7XG4gICAgb3ZlcmxheS5yZW1vdmUoKTtcbiAgfSk7XG5cbiAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yJyk7XG4gICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgIG92ZXJsYXkucmVtb3ZlKCk7XG4gIH0pO1xufTtcblxuQ29tbWVudHMucHJvdG90eXBlLmluc2VydENvbW1lbnRzID0gZnVuY3Rpb24oY29tbWVudHMpIHtcbiAgdmFyIGh0bWwgPSBcIlwiO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgJC5lYWNoKGNvbW1lbnRzLCBmdW5jdGlvbihpLCBjb21tZW50KSB7XG4gICAgaHRtbCArPSBzZWxmLmNvbW1lbnRUZW1wbGF0ZSh7IGNvbW1lbnQ6IGNvbW1lbnQgfSk7XG4gIH0pO1xuXG4gIHRoaXMuJGVsLmZpbmQoJy5jb21tZW50cy1saXN0JykuYXBwZW5kKGh0bWwpO1xuXG4gIHRoaXMuJGVsLmZpbmQoJ2Zvcm0gLmFkZC1jb21tZW50LXRleHQnKS5rZXl1cChmdW5jdGlvbigpIHtcbiAgICBpZiAoJCh0aGlzKS52YWwoKS5sZW5ndGgpIHtcbiAgICAgIHNlbGYuJGVsLmZpbmQoJ2Zvcm0gLmJ0bi1wcmltYXJ5LmRpc2FibGVkJykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuJGVsLmZpbmQoJ2Zvcm0gLmJ0bi1wcmltYXJ5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgfVxuICB9KTtcblxuICB0aGlzLiRlbC5maW5kKCdmb3JtJykuc3VibWl0KGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgIGlmICghJHRoaXMuZmluZCgnLmFkZC1jb21tZW50LXRleHQnKS52YWwoKS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzZWxmLnBvc3RDb21tZW50KFxuICAgICAgc2VsZi5wb3N0SWQsXG4gICAgICBzZWxmLiRlbC5maW5kKCdmb3JtIC5hZGQtY29tbWVudC1uYW1lJykudmFsKCksXG4gICAgICBzZWxmLiRlbC5maW5kKCdmb3JtIC5hZGQtY29tbWVudC10ZXh0JykudmFsKClcbiAgICApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSk7XG59O1xuXG5Db21tZW50cy5wcm90b3R5cGUucG9zdENvbW1lbnQgPSBmdW5jdGlvbihpZCwgbmFtZSwgdGV4dCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgb3ZlcmxheS5kaXNwbGF5KCk7XG5cbiAgLy8gdXNlIGEgY3VzdG9tIG1vY2sgYWpheCBvYmplY3QsIGxvb2tzIGxpa2UgJC5hamF4IHNvIGVhc3kgdG8gcGx1Z2luIHRvIHJlYWwgbGlicmFyeSBsYXRlclxuICB2YXIgcmVxdWVzdCA9IG5ldyBNb2NrQWpheCh7XG4gICAgdHlwZTogJ3Bvc3QnLFxuICAgIHVybDogdGhpcy51cmwsXG4gICAgZGF0YTogeyBtZXRob2Q6ICdwb3N0Q29tbWVudCcsIGlkOiBpZCwgbmFtZTogbmFtZSwgdGV4dDogdGV4dCB9LFxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgfSk7XG5cbiAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgIHNlbGYuJGVsLmZpbmQoJy5hZGQtY29tbWVudC10ZXh0LC5hZGQtY29tbWVudC1uYW1lJykudmFsKCcnKTtcbiAgICAgIHNlbGYuJGVsLmZpbmQoJy5mb3JtIC5idG4tcHJpbWFyeScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgdmFyIGh0bWwgPSBzZWxmLmNvbW1lbnRUZW1wbGF0ZSh7IGNvbW1lbnQ6IHsgbmFtZTogbmFtZSwgdGltZXN0YW1wOiAnSnVuZSAyIDIwMTUgYXQgNDowMCBQTScsIHRleHQ6IHRleHQgfSB9KTtcbiAgICAgIHNlbGYuJGVsLmZpbmQoJy5jb21tZW50cy1saXN0JykucHJlcGVuZChodG1sKTtcbiAgICB9XG5cbiAgICBvdmVybGF5LnJlbW92ZSgpO1xuICB9KTtcblxuICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3InKTtcbiAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgb3ZlcmxheS5yZW1vdmUoKTtcbiAgfSk7XG59OyIsIi8vIGluc3RhbnRpYXRlIE1lZGlhdG9yIGhlcmUsICogc2luZ2xldG9uICpcbm1vZHVsZS5leHBvcnRzID0gbmV3IE1lZGlhdG9yKCk7XG5cbmZ1bmN0aW9uIE1lZGlhdG9yKCkge1xuICB0aGlzLmV2ZW50cyA9IHt9O1xuICByZXR1cm4gdGhpcztcbn1cblxuTWVkaWF0b3IucHJvdG90eXBlLnB1Ymxpc2ggPSBmdW5jdGlvbihtc2csIGRhdGEpIHtcbiAgaWYgKHRoaXMuZXZlbnRzW21zZ10pIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuZXZlbnRzW21zZ10ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB0aGlzLmV2ZW50c1ttc2ddW2ldKGRhdGEpO1xuICAgIH1cbiAgfVxufTtcblxuTWVkaWF0b3IucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uKG1zZywgZikge1xuICBpZiAoIXRoaXMuZXZlbnRzW21zZ10pIHtcbiAgICB0aGlzLmV2ZW50c1ttc2ddID0gW107XG4gIH1cblxuICB0aGlzLmV2ZW50c1ttc2ddLnB1c2goZik7XG59O1xuIiwiXG5cbm1vZHVsZS5leHBvcnRzID0gTW9ja0FqYXg7XG5cbmZ1bmN0aW9uIE1vY2tBamF4KG9wdHMpIHtcbiAgdGhpcy5vcHRzID0gb3B0cztcbiAgdGhpcy5yZXNwb25zZSA9IG51bGw7XG4gIHRoaXMuZG9uZVByb21pc2UgPSBudWxsO1xuICB0aGlzLmZhaWxQcm9taXNlID0gbnVsbDtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBqc29uU3RyaW5nID0gXCJcIjtcblxuICAvLyB0aGlzIHBhcnQgaXMganVzdCB0byBicmluZyBpbiBtb2NrIGRhdGEgZGVwZW5kaW5nIG9uIHRoZSByZXF1ZXN0XG4gIGlmICh0aGlzLm9wdHMuZGF0YS5tZXRob2QgPT0gJ2ZldGNoT3B0aW9ucycpIHtcbiAgICBqc29uU3RyaW5nID0gXCJbXFxuICBcXFwiSnVuZSAyMDE1XFxcIixcXG4gIFxcXCJNYXkgMjAxNVxcXCIsXFxuICBcXFwiQXByaWwgMjAxNVxcXCIsXFxuICBcXFwiTWFyY2ggMjAxNVxcXCIsXFxuICBcXFwiRmVicnVhcnkgMjAxNVxcXCIsXFxuICBcXFwiSmFudWFyeSAyMDE1XFxcIlxcbl1cIjtcbiAgfSBlbHNlIGlmICh0aGlzLm9wdHMuZGF0YS5tZXRob2QgPT0gJ2ZldGNoQmxvZycpIHtcbiAgICBpZiAodGhpcy5vcHRzLmRhdGEuZGF0ZSA9PSAnSnVuZSAyMDE1Jykge1xuICAgICAganNvblN0cmluZyA9IFwie1xcbiAgXFxcImRhdGVcXFwiOiBcXFwiSnVuZSAyMDE1XFxcIixcXG4gIFxcXCJwb3N0c1xcXCI6IFtcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDYsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBncmVhdCBwb3N0XFxcIixcXG4gICAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkp1bmUgMSwgMjAxNSBhdCAzOjAwIFBNXFxcIixcXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuIE1vcmJpIGNvbmRpbWVudHVtIGNvbmd1ZSB2ZWhpY3VsYS4gRnVzY2UgdGluY2lkdW50IGVuaW0gdGVsbHVzLCBlZ2V0IHBvcnRhIGF1Z3VlIHRlbXBvciB1bHRyaWNlcy4gUGVsbGVudGVzcXVlIHN1c2NpcGl0IG9yY2kgaWQgbWF1cmlzIHBvc3VlcmUsIG5lYyBpYWN1bGlzIHR1cnBpcyBpYWN1bGlzLiBQcmFlc2VudCBtYXR0aXMgZW5pbSBpZCBkdWkgbWF4aW11cywgZXUgY29uc2VxdWF0IGR1aSB0cmlzdGlxdWUuIE51bGxhbSBtYXhpbXVzIG5pYmggYXQgZXggbWF0dGlzLCBuZWMgdmVzdGlidWx1bSBlcm9zIG1heGltdXMuIFBlbGxlbnRlc3F1ZSBxdWlzIGZldWdpYXQgZXJvcy4gTnVsbGFtIHZpdGFlIGZyaW5naWxsYSBsZWN0dXMsIGF0IGZhdWNpYnVzIG1pLiBTdXNwZW5kaXNzZSB2ZWwgdml2ZXJyYSBuaWJoLiBWZXN0aWJ1bHVtIGNvbmd1ZSB1cm5hIGVnZXQgdmVsaXQgbGFvcmVldCwgbm9uIGRpZ25pc3NpbSBwdXJ1cyBmYXVjaWJ1cy4gSW50ZWdlciBub24gc2FnaXR0aXMgbnVsbGEuIER1aXMgdXQgdHJpc3RpcXVlIG1pLCBzZWQgc2NlbGVyaXNxdWUgZXN0LiBWaXZhbXVzIHNhcGllbiBzZW0sIGZhdWNpYnVzIGV0IGZhdWNpYnVzIGFjLCBmYWNpbGlzaXMgYSBsZW8uIE51bmMgaW4gc2VtIGxpYmVyby4gXFxcXG5TZWQgbW9sbGlzIHVybmEgYWMgZWdlc3RhcyB2aXZlcnJhLiBVdCBpbiBkb2xvciBldCBqdXN0byBpYWN1bGlzIGRpZ25pc3NpbS4gTnVsbGEgcGVsbGVudGVzcXVlIGxvcmVtIGV0IHRlbGx1cyBsYWNpbmlhLCBzZWQgZ3JhdmlkYSBkdWkgbWF0dGlzLiBDcmFzIHBvc3VlcmUsIGVyYXQgaW4gdGluY2lkdW50IGRpZ25pc3NpbSwgb3JjaSBudW5jIGx1Y3R1cyBkaWFtLCB2ZWwgdWx0cmljaWVzIHNhcGllbiBkaWFtIGlkIG1ldHVzLiBOdW5jIGF1Y3RvciwgbGVjdHVzIHNlZCBydXRydW0gaGVuZHJlcml0LCB1cm5hIG9yY2kgY29uZ3VlIGxpYmVybywgZXUgc2NlbGVyaXNxdWUgcmlzdXMgZmVsaXMgZWdldCB1cm5hLiBWaXZhbXVzIG1vbGxpcyBmZWxpcyBlbmltLCB0aW5jaWR1bnQgY3Vyc3VzIHF1YW0gZ3JhdmlkYSBmcmluZ2lsbGEuIFBoYXNlbGx1cyBtYWxlc3VhZGEgYSBlc3QgZWdldCBldWlzbW9kLiBQcmFlc2VudCB2ZW5lbmF0aXMgbGVvIHZpdGFlIGF1Z3VlIHBvcnR0aXRvciBzY2VsZXJpc3F1ZS4gRG9uZWMgaW1wZXJkaWV0LCBvZGlvLlxcXCJcXG4gICAgfSxcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDcsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBzZWNvbmQgZ3JlYXQgcG9zdFxcXCIsXFxuICAgICAgXFxcInRpbWVzdGFtcFxcXCI6IFxcXCJKdW5lIDEsIDIwMTUgYXQgNDowMCBQTVxcXCIsXFxuICAgICAgXFxcInRleHRcXFwiOiBcXFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdC4gTnVsbGFtIHNlbXBlciBtYXVyaXMgYWMganVzdG8gdGVtcG9yIGNvbnNlY3RldHVyLiBNb3JiaSByaG9uY3VzIGlhY3VsaXMgaXBzdW0gaWQgY29uZGltZW50dW0uIERvbmVjIGZhdWNpYnVzIGxlbyBzY2VsZXJpc3F1ZSBzY2VsZXJpc3F1ZSBhbGlxdWV0LiBNb3JiaSBjb25kaW1lbnR1bSBjb25ndWUgdmVoaWN1bGEuIEZ1c2NlIHRpbmNpZHVudCBlbmltIHRlbGx1cywgZWdldCBwb3J0YSBhdWd1ZSB0ZW1wb3IgdWx0cmljZXMuIFBlbGxlbnRlc3F1ZSBzdXNjaXBpdCBvcmNpIGlkIG1hdXJpcyBwb3N1ZXJlLCBuZWMgaWFjdWxpcyB0dXJwaXMgaWFjdWxpcy4gUHJhZXNlbnQgbWF0dGlzIGVuaW0gaWQgZHVpIG1heGltdXMsIGV1IGNvbnNlcXVhdCBkdWkgdHJpc3RpcXVlLiBOdWxsYW0gbWF4aW11cyBuaWJoIGF0IGV4IG1hdHRpcywgbmVjIHZlc3RpYnVsdW0gZXJvcyBtYXhpbXVzLiBQZWxsZW50ZXNxdWUgcXVpcyBmZXVnaWF0IGVyb3MuIE51bGxhbSB2aXRhZSBmcmluZ2lsbGEgbGVjdHVzLCBhdCBmYXVjaWJ1cyBtaS4gU3VzcGVuZGlzc2UgdmVsIHZpdmVycmEgbmliaC4gVmVzdGlidWx1bSBjb25ndWUgdXJuYSBlZ2V0IHZlbGl0IGxhb3JlZXQsIG5vbiBkaWduaXNzaW0gcHVydXMgZmF1Y2lidXMuIEludGVnZXIgbm9uIHNhZ2l0dGlzIG51bGxhLiBEdWlzIHV0IHRyaXN0aXF1ZSBtaSwgc2VkIHNjZWxlcmlzcXVlIGVzdC4gVml2YW11cyBzYXBpZW4gc2VtLCBmYXVjaWJ1cyBldCBmYXVjaWJ1cyBhYywgZmFjaWxpc2lzIGEgbGVvLiBOdW5jIGluIHNlbSBsaWJlcm8uIFxcXFxuU2VkIG1vbGxpcyB1cm5hIGFjIGVnZXN0YXMgdml2ZXJyYS4gVXQgaW4gZG9sb3IgZXQganVzdG8gaWFjdWxpcyBkaWduaXNzaW0uIE51bGxhIHBlbGxlbnRlc3F1ZSBsb3JlbSBldCB0ZWxsdXMgbGFjaW5pYSwgc2VkIGdyYXZpZGEgZHVpIG1hdHRpcy4gQ3JhcyBwb3N1ZXJlLCBlcmF0IGluIHRpbmNpZHVudCBkaWduaXNzaW0sIG9yY2kgbnVuYyBsdWN0dXMgZGlhbSwgdmVsIHVsdHJpY2llcyBzYXBpZW4gZGlhbSBpZCBtZXR1cy4gTnVuYyBhdWN0b3IsIGxlY3R1cyBzZWQgcnV0cnVtIGhlbmRyZXJpdCwgdXJuYSBvcmNpIGNvbmd1ZSBsaWJlcm8sIGV1IHNjZWxlcmlzcXVlIHJpc3VzIGZlbGlzIGVnZXQgdXJuYS4gVml2YW11cyBtb2xsaXMgZmVsaXMgZW5pbSwgdGluY2lkdW50IGN1cnN1cyBxdWFtIGdyYXZpZGEgZnJpbmdpbGxhLiBQaGFzZWxsdXMgbWFsZXN1YWRhIGEgZXN0IGVnZXQgZXVpc21vZC4gUHJhZXNlbnQgdmVuZW5hdGlzIGxlbyB2aXRhZSBhdWd1ZSBwb3J0dGl0b3Igc2NlbGVyaXNxdWUuIERvbmVjIGltcGVyZGlldCwgb2Rpby5cXFwiXFxuICAgIH0sXFxuICAgIHtcXG4gICAgICBcXFwiaWRcXFwiOiA4LFxcbiAgICAgIFxcXCJ0aXRsZVxcXCI6IFxcXCJUaGUgdGhpcmQgZ3JlYXQgcG9zdFxcXCIsXFxuICAgICAgXFxcInRpbWVzdGFtcFxcXCI6IFxcXCJKdW5lIDEsIDIwMTUgYXQgNTowMCBQTVxcXCIsXFxuICAgICAgXFxcInRleHRcXFwiOiBcXFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdC4gTnVsbGFtIHNlbXBlciBtYXVyaXMgYWMganVzdG8gdGVtcG9yIGNvbnNlY3RldHVyLiBNb3JiaSByaG9uY3VzIGlhY3VsaXMgaXBzdW0gaWQgY29uZGltZW50dW0uIERvbmVjIGZhdWNpYnVzIGxlbyBzY2VsZXJpc3F1ZSBzY2VsZXJpc3F1ZSBhbGlxdWV0LiBNb3JiaSBjb25kaW1lbnR1bSBjb25ndWUgdmVoaWN1bGEuIEZ1c2NlIHRpbmNpZHVudCBlbmltIHRlbGx1cywgZWdldCBwb3J0YSBhdWd1ZSB0ZW1wb3IgdWx0cmljZXMuIFBlbGxlbnRlc3F1ZSBzdXNjaXBpdCBvcmNpIGlkIG1hdXJpcyBwb3N1ZXJlLCBuZWMgaWFjdWxpcyB0dXJwaXMgaWFjdWxpcy4gUHJhZXNlbnQgbWF0dGlzIGVuaW0gaWQgZHVpIG1heGltdXMsIGV1IGNvbnNlcXVhdCBkdWkgdHJpc3RpcXVlLiBOdWxsYW0gbWF4aW11cyBuaWJoIGF0IGV4IG1hdHRpcywgbmVjIHZlc3RpYnVsdW0gZXJvcyBtYXhpbXVzLiBQZWxsZW50ZXNxdWUgcXVpcyBmZXVnaWF0IGVyb3MuIE51bGxhbSB2aXRhZSBmcmluZ2lsbGEgbGVjdHVzLCBhdCBmYXVjaWJ1cyBtaS4gU3VzcGVuZGlzc2UgdmVsIHZpdmVycmEgbmliaC4gVmVzdGlidWx1bSBjb25ndWUgdXJuYSBlZ2V0IHZlbGl0IGxhb3JlZXQsIG5vbiBkaWduaXNzaW0gcHVydXMgZmF1Y2lidXMuIEludGVnZXIgbm9uIHNhZ2l0dGlzIG51bGxhLiBEdWlzIHV0IHRyaXN0aXF1ZSBtaSwgc2VkIHNjZWxlcmlzcXVlIGVzdC4gVml2YW11cyBzYXBpZW4gc2VtLCBmYXVjaWJ1cyBldCBmYXVjaWJ1cyBhYywgZmFjaWxpc2lzIGEgbGVvLiBOdW5jIGluIHNlbSBsaWJlcm8uIFxcXFxuU2VkIG1vbGxpcyB1cm5hIGFjIGVnZXN0YXMgdml2ZXJyYS4gVXQgaW4gZG9sb3IgZXQganVzdG8gaWFjdWxpcyBkaWduaXNzaW0uIE51bGxhIHBlbGxlbnRlc3F1ZSBsb3JlbSBldCB0ZWxsdXMgbGFjaW5pYSwgc2VkIGdyYXZpZGEgZHVpIG1hdHRpcy4gQ3JhcyBwb3N1ZXJlLCBlcmF0IGluIHRpbmNpZHVudCBkaWduaXNzaW0sIG9yY2kgbnVuYyBsdWN0dXMgZGlhbSwgdmVsIHVsdHJpY2llcyBzYXBpZW4gZGlhbSBpZCBtZXR1cy4gTnVuYyBhdWN0b3IsIGxlY3R1cyBzZWQgcnV0cnVtIGhlbmRyZXJpdCwgdXJuYSBvcmNpIGNvbmd1ZSBsaWJlcm8sIGV1IHNjZWxlcmlzcXVlIHJpc3VzIGZlbGlzIGVnZXQgdXJuYS4gVml2YW11cyBtb2xsaXMgZmVsaXMgZW5pbSwgdGluY2lkdW50IGN1cnN1cyBxdWFtIGdyYXZpZGEgZnJpbmdpbGxhLiBQaGFzZWxsdXMgbWFsZXN1YWRhIGEgZXN0IGVnZXQgZXVpc21vZC4gUHJhZXNlbnQgdmVuZW5hdGlzIGxlbyB2aXRhZSBhdWd1ZSBwb3J0dGl0b3Igc2NlbGVyaXNxdWUuIERvbmVjIGltcGVyZGlldCwgb2Rpby5cXFwiXFxuICAgIH1cXG4gIF1cXG59XCI7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdHMuZGF0YS5kYXRlID09ICdNYXkgMjAxNScpIHtcbiAgICAgIGpzb25TdHJpbmcgPSBcIntcXG4gIFxcXCJkYXRlXFxcIjogXFxcIk1heSAyMDE1XFxcIixcXG4gIFxcXCJwb3N0c1xcXCI6IFtcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDUsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBncmVhdCBwb3N0XFxcIixcXG4gICAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIk1heSAxLCAyMDE1IGF0IDM6MDAgUE1cXFwiLFxcbiAgICAgIFxcXCJ0ZXh0XFxcIjogXFxcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIE51bGxhbSBzZW1wZXIgbWF1cmlzIGFjIGp1c3RvIHRlbXBvciBjb25zZWN0ZXR1ci4gTW9yYmkgcmhvbmN1cyBpYWN1bGlzIGlwc3VtIGlkIGNvbmRpbWVudHVtLiBEb25lYyBmYXVjaWJ1cyBsZW8gc2NlbGVyaXNxdWUgc2NlbGVyaXNxdWUgYWxpcXVldC4gTW9yYmkgY29uZGltZW50dW0gY29uZ3VlIHZlaGljdWxhLiBGdXNjZSB0aW5jaWR1bnQgZW5pbSB0ZWxsdXMsIGVnZXQgcG9ydGEgYXVndWUgdGVtcG9yIHVsdHJpY2VzLiBQZWxsZW50ZXNxdWUgc3VzY2lwaXQgb3JjaSBpZCBtYXVyaXMgcG9zdWVyZSwgbmVjIGlhY3VsaXMgdHVycGlzIGlhY3VsaXMuIFByYWVzZW50IG1hdHRpcyBlbmltIGlkIGR1aSBtYXhpbXVzLCBldSBjb25zZXF1YXQgZHVpIHRyaXN0aXF1ZS4gTnVsbGFtIG1heGltdXMgbmliaCBhdCBleCBtYXR0aXMsIG5lYyB2ZXN0aWJ1bHVtIGVyb3MgbWF4aW11cy4gUGVsbGVudGVzcXVlIHF1aXMgZmV1Z2lhdCBlcm9zLiBOdWxsYW0gdml0YWUgZnJpbmdpbGxhIGxlY3R1cywgYXQgZmF1Y2lidXMgbWkuIFN1c3BlbmRpc3NlIHZlbCB2aXZlcnJhIG5pYmguIFZlc3RpYnVsdW0gY29uZ3VlIHVybmEgZWdldCB2ZWxpdCBsYW9yZWV0LCBub24gZGlnbmlzc2ltIHB1cnVzIGZhdWNpYnVzLiBJbnRlZ2VyIG5vbiBzYWdpdHRpcyBudWxsYS4gRHVpcyB1dCB0cmlzdGlxdWUgbWksIHNlZCBzY2VsZXJpc3F1ZSBlc3QuIFZpdmFtdXMgc2FwaWVuIHNlbSwgZmF1Y2lidXMgZXQgZmF1Y2lidXMgYWMsIGZhY2lsaXNpcyBhIGxlby4gTnVuYyBpbiBzZW0gbGliZXJvLiBcXFxcblNlZCBtb2xsaXMgdXJuYSBhYyBlZ2VzdGFzIHZpdmVycmEuIFV0IGluIGRvbG9yIGV0IGp1c3RvIGlhY3VsaXMgZGlnbmlzc2ltLiBOdWxsYSBwZWxsZW50ZXNxdWUgbG9yZW0gZXQgdGVsbHVzIGxhY2luaWEsIHNlZCBncmF2aWRhIGR1aSBtYXR0aXMuIENyYXMgcG9zdWVyZSwgZXJhdCBpbiB0aW5jaWR1bnQgZGlnbmlzc2ltLCBvcmNpIG51bmMgbHVjdHVzIGRpYW0sIHZlbCB1bHRyaWNpZXMgc2FwaWVuIGRpYW0gaWQgbWV0dXMuIE51bmMgYXVjdG9yLCBsZWN0dXMgc2VkIHJ1dHJ1bSBoZW5kcmVyaXQsIHVybmEgb3JjaSBjb25ndWUgbGliZXJvLCBldSBzY2VsZXJpc3F1ZSByaXN1cyBmZWxpcyBlZ2V0IHVybmEuIFZpdmFtdXMgbW9sbGlzIGZlbGlzIGVuaW0sIHRpbmNpZHVudCBjdXJzdXMgcXVhbSBncmF2aWRhIGZyaW5naWxsYS4gUGhhc2VsbHVzIG1hbGVzdWFkYSBhIGVzdCBlZ2V0IGV1aXNtb2QuIFByYWVzZW50IHZlbmVuYXRpcyBsZW8gdml0YWUgYXVndWUgcG9ydHRpdG9yIHNjZWxlcmlzcXVlLiBEb25lYyBpbXBlcmRpZXQsIG9kaW8uXFxcIlxcbiAgICB9XFxuICBdXFxufVwiO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRzLmRhdGEuZGF0ZSA9PSAnQXByaWwgMjAxNScpIHtcbiAgICAgIGpzb25TdHJpbmcgPSBcIntcXG4gIFxcXCJkYXRlXFxcIjogXFxcIkFwcmlsIDIwMTVcXFwiLFxcbiAgXFxcInBvc3RzXFxcIjogW1xcbiAgICB7XFxuICAgICAgXFxcImlkXFxcIjogNCxcXG4gICAgICBcXFwidGl0bGVcXFwiOiBcXFwiVGhlIGdyZWF0IHBvc3RcXFwiLFxcbiAgICAgIFxcXCJ0aW1lc3RhbXBcXFwiOiBcXFwiQXByaWwgMSwgMjAxNSBhdCAzOjAwIFBNXFxcIixcXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuIE1vcmJpIGNvbmRpbWVudHVtIGNvbmd1ZSB2ZWhpY3VsYS4gRnVzY2UgdGluY2lkdW50IGVuaW0gdGVsbHVzLCBlZ2V0IHBvcnRhIGF1Z3VlIHRlbXBvciB1bHRyaWNlcy4gUGVsbGVudGVzcXVlIHN1c2NpcGl0IG9yY2kgaWQgbWF1cmlzIHBvc3VlcmUsIG5lYyBpYWN1bGlzIHR1cnBpcyBpYWN1bGlzLiBQcmFlc2VudCBtYXR0aXMgZW5pbSBpZCBkdWkgbWF4aW11cywgZXUgY29uc2VxdWF0IGR1aSB0cmlzdGlxdWUuIE51bGxhbSBtYXhpbXVzIG5pYmggYXQgZXggbWF0dGlzLCBuZWMgdmVzdGlidWx1bSBlcm9zIG1heGltdXMuIFBlbGxlbnRlc3F1ZSBxdWlzIGZldWdpYXQgZXJvcy4gTnVsbGFtIHZpdGFlIGZyaW5naWxsYSBsZWN0dXMsIGF0IGZhdWNpYnVzIG1pLiBTdXNwZW5kaXNzZSB2ZWwgdml2ZXJyYSBuaWJoLiBWZXN0aWJ1bHVtIGNvbmd1ZSB1cm5hIGVnZXQgdmVsaXQgbGFvcmVldCwgbm9uIGRpZ25pc3NpbSBwdXJ1cyBmYXVjaWJ1cy4gSW50ZWdlciBub24gc2FnaXR0aXMgbnVsbGEuIER1aXMgdXQgdHJpc3RpcXVlIG1pLCBzZWQgc2NlbGVyaXNxdWUgZXN0LiBWaXZhbXVzIHNhcGllbiBzZW0sIGZhdWNpYnVzIGV0IGZhdWNpYnVzIGFjLCBmYWNpbGlzaXMgYSBsZW8uIE51bmMgaW4gc2VtIGxpYmVyby4gXFxcXG5TZWQgbW9sbGlzIHVybmEgYWMgZWdlc3RhcyB2aXZlcnJhLiBVdCBpbiBkb2xvciBldCBqdXN0byBpYWN1bGlzIGRpZ25pc3NpbS4gTnVsbGEgcGVsbGVudGVzcXVlIGxvcmVtIGV0IHRlbGx1cyBsYWNpbmlhLCBzZWQgZ3JhdmlkYSBkdWkgbWF0dGlzLiBDcmFzIHBvc3VlcmUsIGVyYXQgaW4gdGluY2lkdW50IGRpZ25pc3NpbSwgb3JjaSBudW5jIGx1Y3R1cyBkaWFtLCB2ZWwgdWx0cmljaWVzIHNhcGllbiBkaWFtIGlkIG1ldHVzLiBOdW5jIGF1Y3RvciwgbGVjdHVzIHNlZCBydXRydW0gaGVuZHJlcml0LCB1cm5hIG9yY2kgY29uZ3VlIGxpYmVybywgZXUgc2NlbGVyaXNxdWUgcmlzdXMgZmVsaXMgZWdldCB1cm5hLiBWaXZhbXVzIG1vbGxpcyBmZWxpcyBlbmltLCB0aW5jaWR1bnQgY3Vyc3VzIHF1YW0gZ3JhdmlkYSBmcmluZ2lsbGEuIFBoYXNlbGx1cyBtYWxlc3VhZGEgYSBlc3QgZWdldCBldWlzbW9kLiBQcmFlc2VudCB2ZW5lbmF0aXMgbGVvIHZpdGFlIGF1Z3VlIHBvcnR0aXRvciBzY2VsZXJpc3F1ZS4gRG9uZWMgaW1wZXJkaWV0LCBvZGlvLlxcXCJcXG4gICAgfVxcbiAgXVxcbn1cIjtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0cy5kYXRhLmRhdGUgPT0gJ01hcmNoIDIwMTUnKSB7XG4gICAgICBqc29uU3RyaW5nID0gXCJ7XFxuICBcXFwiZGF0ZVxcXCI6IFxcXCJNYXJjaCAyMDE1XFxcIixcXG4gIFxcXCJwb3N0c1xcXCI6IFtcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDMsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBncmVhdCBwb3N0XFxcIixcXG4gICAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIk1hcmNoIDEsIDIwMTUgYXQgMzowMCBQTVxcXCIsXFxuICAgICAgXFxcInRleHRcXFwiOiBcXFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdC4gTnVsbGFtIHNlbXBlciBtYXVyaXMgYWMganVzdG8gdGVtcG9yIGNvbnNlY3RldHVyLiBNb3JiaSByaG9uY3VzIGlhY3VsaXMgaXBzdW0gaWQgY29uZGltZW50dW0uIERvbmVjIGZhdWNpYnVzIGxlbyBzY2VsZXJpc3F1ZSBzY2VsZXJpc3F1ZSBhbGlxdWV0LiBNb3JiaSBjb25kaW1lbnR1bSBjb25ndWUgdmVoaWN1bGEuIEZ1c2NlIHRpbmNpZHVudCBlbmltIHRlbGx1cywgZWdldCBwb3J0YSBhdWd1ZSB0ZW1wb3IgdWx0cmljZXMuIFBlbGxlbnRlc3F1ZSBzdXNjaXBpdCBvcmNpIGlkIG1hdXJpcyBwb3N1ZXJlLCBuZWMgaWFjdWxpcyB0dXJwaXMgaWFjdWxpcy4gUHJhZXNlbnQgbWF0dGlzIGVuaW0gaWQgZHVpIG1heGltdXMsIGV1IGNvbnNlcXVhdCBkdWkgdHJpc3RpcXVlLiBOdWxsYW0gbWF4aW11cyBuaWJoIGF0IGV4IG1hdHRpcywgbmVjIHZlc3RpYnVsdW0gZXJvcyBtYXhpbXVzLiBQZWxsZW50ZXNxdWUgcXVpcyBmZXVnaWF0IGVyb3MuIE51bGxhbSB2aXRhZSBmcmluZ2lsbGEgbGVjdHVzLCBhdCBmYXVjaWJ1cyBtaS4gU3VzcGVuZGlzc2UgdmVsIHZpdmVycmEgbmliaC4gVmVzdGlidWx1bSBjb25ndWUgdXJuYSBlZ2V0IHZlbGl0IGxhb3JlZXQsIG5vbiBkaWduaXNzaW0gcHVydXMgZmF1Y2lidXMuIEludGVnZXIgbm9uIHNhZ2l0dGlzIG51bGxhLiBEdWlzIHV0IHRyaXN0aXF1ZSBtaSwgc2VkIHNjZWxlcmlzcXVlIGVzdC4gVml2YW11cyBzYXBpZW4gc2VtLCBmYXVjaWJ1cyBldCBmYXVjaWJ1cyBhYywgZmFjaWxpc2lzIGEgbGVvLiBOdW5jIGluIHNlbSBsaWJlcm8uIFxcXFxuU2VkIG1vbGxpcyB1cm5hIGFjIGVnZXN0YXMgdml2ZXJyYS4gVXQgaW4gZG9sb3IgZXQganVzdG8gaWFjdWxpcyBkaWduaXNzaW0uIE51bGxhIHBlbGxlbnRlc3F1ZSBsb3JlbSBldCB0ZWxsdXMgbGFjaW5pYSwgc2VkIGdyYXZpZGEgZHVpIG1hdHRpcy4gQ3JhcyBwb3N1ZXJlLCBlcmF0IGluIHRpbmNpZHVudCBkaWduaXNzaW0sIG9yY2kgbnVuYyBsdWN0dXMgZGlhbSwgdmVsIHVsdHJpY2llcyBzYXBpZW4gZGlhbSBpZCBtZXR1cy4gTnVuYyBhdWN0b3IsIGxlY3R1cyBzZWQgcnV0cnVtIGhlbmRyZXJpdCwgdXJuYSBvcmNpIGNvbmd1ZSBsaWJlcm8sIGV1IHNjZWxlcmlzcXVlIHJpc3VzIGZlbGlzIGVnZXQgdXJuYS4gVml2YW11cyBtb2xsaXMgZmVsaXMgZW5pbSwgdGluY2lkdW50IGN1cnN1cyBxdWFtIGdyYXZpZGEgZnJpbmdpbGxhLiBQaGFzZWxsdXMgbWFsZXN1YWRhIGEgZXN0IGVnZXQgZXVpc21vZC4gUHJhZXNlbnQgdmVuZW5hdGlzIGxlbyB2aXRhZSBhdWd1ZSBwb3J0dGl0b3Igc2NlbGVyaXNxdWUuIERvbmVjIGltcGVyZGlldCwgb2Rpby5cXFwiXFxuICAgIH1cXG4gIF1cXG59XCI7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdHMuZGF0YS5kYXRlID09ICdGZWJydWFyeSAyMDE1Jykge1xuICAgICAganNvblN0cmluZyA9IFwie1xcbiAgXFxcImRhdGVcXFwiOiBcXFwiRmVicnVhcnkgMjAxNVxcXCIsXFxuICBcXFwicG9zdHNcXFwiOiBbXFxuICAgIHtcXG4gICAgICBcXFwiaWRcXFwiOiAyLFxcbiAgICAgIFxcXCJ0aXRsZVxcXCI6IFxcXCJUaGUgZ3JlYXQgcG9zdFxcXCIsXFxuICAgICAgXFxcInRpbWVzdGFtcFxcXCI6IFxcXCJGZWJydWFyeSAxLCAyMDE1IGF0IDM6MDAgUE1cXFwiLFxcbiAgICAgIFxcXCJ0ZXh0XFxcIjogXFxcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIE51bGxhbSBzZW1wZXIgbWF1cmlzIGFjIGp1c3RvIHRlbXBvciBjb25zZWN0ZXR1ci4gTW9yYmkgcmhvbmN1cyBpYWN1bGlzIGlwc3VtIGlkIGNvbmRpbWVudHVtLiBEb25lYyBmYXVjaWJ1cyBsZW8gc2NlbGVyaXNxdWUgc2NlbGVyaXNxdWUgYWxpcXVldC4gTW9yYmkgY29uZGltZW50dW0gY29uZ3VlIHZlaGljdWxhLiBGdXNjZSB0aW5jaWR1bnQgZW5pbSB0ZWxsdXMsIGVnZXQgcG9ydGEgYXVndWUgdGVtcG9yIHVsdHJpY2VzLiBQZWxsZW50ZXNxdWUgc3VzY2lwaXQgb3JjaSBpZCBtYXVyaXMgcG9zdWVyZSwgbmVjIGlhY3VsaXMgdHVycGlzIGlhY3VsaXMuIFByYWVzZW50IG1hdHRpcyBlbmltIGlkIGR1aSBtYXhpbXVzLCBldSBjb25zZXF1YXQgZHVpIHRyaXN0aXF1ZS4gTnVsbGFtIG1heGltdXMgbmliaCBhdCBleCBtYXR0aXMsIG5lYyB2ZXN0aWJ1bHVtIGVyb3MgbWF4aW11cy4gUGVsbGVudGVzcXVlIHF1aXMgZmV1Z2lhdCBlcm9zLiBOdWxsYW0gdml0YWUgZnJpbmdpbGxhIGxlY3R1cywgYXQgZmF1Y2lidXMgbWkuIFN1c3BlbmRpc3NlIHZlbCB2aXZlcnJhIG5pYmguIFZlc3RpYnVsdW0gY29uZ3VlIHVybmEgZWdldCB2ZWxpdCBsYW9yZWV0LCBub24gZGlnbmlzc2ltIHB1cnVzIGZhdWNpYnVzLiBJbnRlZ2VyIG5vbiBzYWdpdHRpcyBudWxsYS4gRHVpcyB1dCB0cmlzdGlxdWUgbWksIHNlZCBzY2VsZXJpc3F1ZSBlc3QuIFZpdmFtdXMgc2FwaWVuIHNlbSwgZmF1Y2lidXMgZXQgZmF1Y2lidXMgYWMsIGZhY2lsaXNpcyBhIGxlby4gTnVuYyBpbiBzZW0gbGliZXJvLiBcXFxcblNlZCBtb2xsaXMgdXJuYSBhYyBlZ2VzdGFzIHZpdmVycmEuIFV0IGluIGRvbG9yIGV0IGp1c3RvIGlhY3VsaXMgZGlnbmlzc2ltLiBOdWxsYSBwZWxsZW50ZXNxdWUgbG9yZW0gZXQgdGVsbHVzIGxhY2luaWEsIHNlZCBncmF2aWRhIGR1aSBtYXR0aXMuIENyYXMgcG9zdWVyZSwgZXJhdCBpbiB0aW5jaWR1bnQgZGlnbmlzc2ltLCBvcmNpIG51bmMgbHVjdHVzIGRpYW0sIHZlbCB1bHRyaWNpZXMgc2FwaWVuIGRpYW0gaWQgbWV0dXMuIE51bmMgYXVjdG9yLCBsZWN0dXMgc2VkIHJ1dHJ1bSBoZW5kcmVyaXQsIHVybmEgb3JjaSBjb25ndWUgbGliZXJvLCBldSBzY2VsZXJpc3F1ZSByaXN1cyBmZWxpcyBlZ2V0IHVybmEuIFZpdmFtdXMgbW9sbGlzIGZlbGlzIGVuaW0sIHRpbmNpZHVudCBjdXJzdXMgcXVhbSBncmF2aWRhIGZyaW5naWxsYS4gUGhhc2VsbHVzIG1hbGVzdWFkYSBhIGVzdCBlZ2V0IGV1aXNtb2QuIFByYWVzZW50IHZlbmVuYXRpcyBsZW8gdml0YWUgYXVndWUgcG9ydHRpdG9yIHNjZWxlcmlzcXVlLiBEb25lYyBpbXBlcmRpZXQsIG9kaW8uXFxcIlxcbiAgICB9XFxuICBdXFxufVwiO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRzLmRhdGEuZGF0ZSA9PSAnSmFudWFyeSAyMDE1Jykge1xuICAgICAganNvblN0cmluZyA9IFwie1xcbiAgXFxcImRhdGVcXFwiOiBcXFwiSmFudWFyeSAyMDE1XFxcIixcXG4gIFxcXCJwb3N0c1xcXCI6IFtcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDEsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBncmVhdCBwb3N0XFxcIixcXG4gICAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkphbnVhcnkgMSwgMjAxNSBhdCAzOjAwIFBNXFxcIixcXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuIE1vcmJpIGNvbmRpbWVudHVtIGNvbmd1ZSB2ZWhpY3VsYS4gRnVzY2UgdGluY2lkdW50IGVuaW0gdGVsbHVzLCBlZ2V0IHBvcnRhIGF1Z3VlIHRlbXBvciB1bHRyaWNlcy4gUGVsbGVudGVzcXVlIHN1c2NpcGl0IG9yY2kgaWQgbWF1cmlzIHBvc3VlcmUsIG5lYyBpYWN1bGlzIHR1cnBpcyBpYWN1bGlzLiBQcmFlc2VudCBtYXR0aXMgZW5pbSBpZCBkdWkgbWF4aW11cywgZXUgY29uc2VxdWF0IGR1aSB0cmlzdGlxdWUuIE51bGxhbSBtYXhpbXVzIG5pYmggYXQgZXggbWF0dGlzLCBuZWMgdmVzdGlidWx1bSBlcm9zIG1heGltdXMuIFBlbGxlbnRlc3F1ZSBxdWlzIGZldWdpYXQgZXJvcy4gTnVsbGFtIHZpdGFlIGZyaW5naWxsYSBsZWN0dXMsIGF0IGZhdWNpYnVzIG1pLiBTdXNwZW5kaXNzZSB2ZWwgdml2ZXJyYSBuaWJoLiBWZXN0aWJ1bHVtIGNvbmd1ZSB1cm5hIGVnZXQgdmVsaXQgbGFvcmVldCwgbm9uIGRpZ25pc3NpbSBwdXJ1cyBmYXVjaWJ1cy4gSW50ZWdlciBub24gc2FnaXR0aXMgbnVsbGEuIER1aXMgdXQgdHJpc3RpcXVlIG1pLCBzZWQgc2NlbGVyaXNxdWUgZXN0LiBWaXZhbXVzIHNhcGllbiBzZW0sIGZhdWNpYnVzIGV0IGZhdWNpYnVzIGFjLCBmYWNpbGlzaXMgYSBsZW8uIE51bmMgaW4gc2VtIGxpYmVyby4gXFxcXG5TZWQgbW9sbGlzIHVybmEgYWMgZWdlc3RhcyB2aXZlcnJhLiBVdCBpbiBkb2xvciBldCBqdXN0byBpYWN1bGlzIGRpZ25pc3NpbS4gTnVsbGEgcGVsbGVudGVzcXVlIGxvcmVtIGV0IHRlbGx1cyBsYWNpbmlhLCBzZWQgZ3JhdmlkYSBkdWkgbWF0dGlzLiBDcmFzIHBvc3VlcmUsIGVyYXQgaW4gdGluY2lkdW50IGRpZ25pc3NpbSwgb3JjaSBudW5jIGx1Y3R1cyBkaWFtLCB2ZWwgdWx0cmljaWVzIHNhcGllbiBkaWFtIGlkIG1ldHVzLiBOdW5jIGF1Y3RvciwgbGVjdHVzIHNlZCBydXRydW0gaGVuZHJlcml0LCB1cm5hIG9yY2kgY29uZ3VlIGxpYmVybywgZXUgc2NlbGVyaXNxdWUgcmlzdXMgZmVsaXMgZWdldCB1cm5hLiBWaXZhbXVzIG1vbGxpcyBmZWxpcyBlbmltLCB0aW5jaWR1bnQgY3Vyc3VzIHF1YW0gZ3JhdmlkYSBmcmluZ2lsbGEuIFBoYXNlbGx1cyBtYWxlc3VhZGEgYSBlc3QgZWdldCBldWlzbW9kLiBQcmFlc2VudCB2ZW5lbmF0aXMgbGVvIHZpdGFlIGF1Z3VlIHBvcnR0aXRvciBzY2VsZXJpc3F1ZS4gRG9uZWMgaW1wZXJkaWV0LCBvZGlvLlxcXCJcXG4gICAgfVxcbiAgXVxcbn1cIjtcbiAgICB9XG4gIH0gZWxzZSBpZiAodGhpcy5vcHRzLmRhdGEubWV0aG9kID09ICdmZXRjaENvbW1lbnRzJykge1xuICAgIGpzb25TdHJpbmcgPSBcIltcXG4gIHtcXG4gICAgXFxcIm5hbWVcXFwiOiBcXFwiVGhpcyBndXlcXFwiLFxcbiAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkp1bmUgMiAyMDE1IGF0IDQ6MDAgUE1cXFwiLFxcbiAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuXFxcIlxcbiAgfSxcXG4gIHtcXG4gICAgXFxcIm5hbWVcXFwiOiBcXFwiVGhhdCBndXlcXFwiLFxcbiAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkp1bmUgMiAyMDE1IGF0IDQ6MDAgUE1cXFwiLFxcbiAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuXFxcIlxcbiAgfVxcbiAgLFxcbiAge1xcbiAgICBcXFwibmFtZVxcXCI6IFxcXCJGaW5hbCBndXlcXFwiLFxcbiAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkp1bmUgMiAyMDE1IGF0IDQ6MDAgUE1cXFwiLFxcbiAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuXFxcIlxcbiAgfVxcbl1cIjtcbiAgfSBlbHNlIGlmICh0aGlzLm9wdHMuZGF0YS5tZXRob2QgPT0gJ3Bvc3RDb21tZW50Jykge1xuICAgIGpzb25TdHJpbmcgPSBcIntcXG4gIFxcXCJzdWNjZXNzXFxcIjogdHJ1ZVxcbn1cIjtcbiAgfVxuXG4gIHRoaXMucmVzcG9uc2UgPSBKU09OLnBhcnNlKGpzb25TdHJpbmcpO1xuXG4gIC8vIHNldCB0aW1lciB0byBydW4gdGhpcy5kb25lUHJvbWlzZSBhZnRlciBzb21lIHRpbWVvdXQsIHNpbXVsYXRlIGEgbmV0d29yayBkZWxheVxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLmRvbmVQcm9taXNlKSB7XG4gICAgICBzZWxmLmRvbmVQcm9taXNlKHNlbGYucmVzcG9uc2UpO1xuICAgIH1cbiAgfSwgMjAwKTtcblxuICByZXR1cm4gdGhpcztcbn1cblxuTW9ja0FqYXgucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbihmKSB7XG4gIHRoaXMuZG9uZVByb21pc2UgPSBmO1xufTtcblxuTW9ja0FqYXgucHJvdG90eXBlLmZhaWwgPSBmdW5jdGlvbihmKSB7XG4gIHRoaXMuZmFpbFByb21pc2UgPSBmO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IG5ldyBPdmVybGF5KCk7XG5cbmZ1bmN0aW9uIE92ZXJsYXkoKSB7XG4gIHRoaXMudGltZXIgPSBudWxsO1xuICB0aGlzLmltYWdlID0gbnVsbDtcbiAgdGhpcy5oZWlnaHQgPSAwO1xuICB0aGlzLndpZHRoID0gMDtcbiAgdGhpcy4kaW1nID0gbnVsbDtcbiAgdGhpcy5mcmFtZXMgPSAwO1xuICB0aGlzLmludGVydmFsID0gMDtcbiAgdGhpcy54ID0gMDtcbiAgdGhpcy5pbmRleCA9IDA7XG59XG5cbk92ZXJsYXkucHJvdG90eXBlLnNldENvbmZpZyA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgdGhpcy50aW1lciA9IG51bGw7XG4gIHRoaXMuaGVpZ2h0ID0gYXJncy5oZWlnaHQ7XG4gIHRoaXMud2lkdGggPSBhcmdzLndpZHRoO1xuICB0aGlzLiRpbWcgPSBhcmdzLmltZztcbiAgdGhpcy4kb3ZlcmxheSA9IGFyZ3Mub3ZlcmxheTtcbiAgdGhpcy5mcmFtZXMgPSBhcmdzLmZyYW1lcztcbiAgdGhpcy5pbnRlcnZhbCA9IGFyZ3MuaW50ZXJ2YWw7XG4gIHRoaXMueCA9IDA7XG4gIHRoaXMuaW5kZXggPSAwO1xuICB0aGlzLmltYWdlID0gbmV3IEltYWdlKCk7XG4gIHRoaXMuaW1hZ2Uuc3JjID0gYXJncy5zcmM7XG4gIHRoaXMuJGltZy5jc3MoJ2JhY2tncm91bmRJbWFnZScsICd1cmwoJyArIHRoaXMuaW1hZ2Uuc3JjICsgJyknKTtcbiAgdGhpcy4kaW1nLndpZHRoKHRoaXMud2lkdGggKyAncHgnKTtcbiAgdGhpcy4kaW1nLmhlaWdodCh0aGlzLmhlaWdodCArICdweCcpO1xufTtcblxuT3ZlcmxheS5wcm90b3R5cGUuZGlzcGxheSA9IGZ1bmN0aW9uKCkge1xuICAvLyBzaG93IHRoZSBvdmVybGF5XG4gIGlmICh0aGlzLnRpbWVyID09PSBudWxsKSB7XG4gICAgdGhpcy5hbmltYXRlKCk7XG4gICAgdGhpcy4kb3ZlcmxheS5zaG93KCk7XG4gIH1cbn07XG5cbk92ZXJsYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBoaWRlIHRoZSBvdmVybGF5XG4gIHRoaXMuJG92ZXJsYXkuaGlkZSgpO1xuICBjbGVhclRpbWVvdXQodGhpcy50aW1lcik7XG4gIHRoaXMudGltZXIgPSBudWxsO1xuICB0aGlzLnggPSAwO1xuICB0aGlzLmluZGV4ID0gMDtcbn07XG5cbk92ZXJsYXkucHJvdG90eXBlLmFuaW1hdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy4kaW1nLmNzcygnYmFja2dyb3VuZFBvc2l0aW9uJywgdGhpcy54ICsgJ3B4IDAnKTtcbiAgdGhpcy54IC09IHRoaXMud2lkdGg7XG4gIHRoaXMuaW5kZXgrKztcblxuICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLmZyYW1lcykge1xuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy5pbmRleCA9IDA7XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdGhpcy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5hbmltYXRlKCk7XG4gIH0sIHRoaXMuaW50ZXJ2YWwpO1xufTsiLCJcbnZhciBtZWRpYXRvciA9IHJlcXVpcmUoJy4uL21lZGlhdG9yL21lZGlhdG9yJyk7XG52YXIgTW9ja0FqYXggPSByZXF1aXJlKCcuLi9tb2NrX2FqYXgvbW9ja19hamF4Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2lkZWJhcjtcblxuZnVuY3Rpb24gU2lkZWJhcihvcHRzKSB7XG4gIHZhciBodG1sID0gXCI8ZGl2IGNsYXNzPVxcXCJzaWRlYmFyXFxcIj5cXG4gICA8dWw+PC91bD5cXG4gICA8aHI+XFxuPC9kaXY+XFxuXCI7XG4gIHRoaXMuJGVsID0gJChodG1sKTtcbiAgdGhpcy5lbGVtZW50c1RlbXBsYXRlID0gXy50ZW1wbGF0ZShcIjwlIF8uZWFjaChlbGVtZW50cywgZnVuY3Rpb24oZWwsIGkpIHsgJT5cXG4gIDxsaTwlPSBpID09IDAgPyAnIGNsYXNzPVxcXCJhY3RpdmVcXFwiJyA6ICcnICU+PlxcbiAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OiB2b2lkKDApO1xcXCI+PCU9IGVsICU+PC9hPlxcbiAgPC9saT5cXG48JSB9KTsgJT5cXG5cIik7XG4gIHRoaXMudXJsID0gb3B0cy51cmw7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIG1lZGlhdG9yLnN1YnNjcmliZSgncGFnZS1pbml0JywgZnVuY3Rpb24oKSB7ICBcbiAgICBzZWxmLmZldGNoT3B0aW9ucygpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn1cblxuU2lkZWJhci5wcm90b3R5cGUuYXBwZW5kVG8gPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgJCh0YXJnZXQpLmFwcGVuZCh0aGlzLiRlbCk7XG59O1xuXG5TaWRlYmFyLnByb3RvdHlwZS5mZXRjaE9wdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIC8vIHVzZSBhIGN1c3RvbSBtb2NrIGFqYXggb2JqZWN0LCBsb29rcyBsaWtlICQuYWpheCBzbyBlYXN5IHRvIHBsdWdpbiB0byByZWFsIGxpYnJhcnkgbGF0ZXJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgTW9ja0FqYXgoe1xuICAgIHR5cGU6ICdnZXQnLFxuICAgIHVybDogdGhpcy51cmwsXG4gICAgZGF0YTogeyBtZXRob2Q6ICdmZXRjaE9wdGlvbnMnIH0sXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICB9KTtcblxuICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBzZWxmLmluc2VydE9wdGlvbnMocmVzcG9uc2UpO1xuICAgIG1lZGlhdG9yLnB1Ymxpc2goJ29wdGlvbi1zZWxlY3RlZCcsIHsgZGF0ZTogcmVzcG9uc2VbMF0gfSk7XG4gIH0pO1xuXG4gIHJlcXVlc3QuZmFpbChmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvcicpO1xuICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgfSk7XG59O1xuXG5TaWRlYmFyLnByb3RvdHlwZS5pbnNlcnRPcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgJHVsID0gdGhpcy4kZWwuZmluZCgndWwnKTtcbiAgJHVsLmFwcGVuZCh0aGlzLmVsZW1lbnRzVGVtcGxhdGUoeyBlbGVtZW50czogb3B0aW9ucyB9KSk7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICR1bC5maW5kKCdhJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgdmFyICRhID0gJCh0aGlzKTtcbiAgICB2YXIgJHBhcmVudCA9ICRhLnBhcmVudCgpO1xuXG4gICAgaWYgKCRwYXJlbnQuaGFzQ2xhc3MoJ2FjdGl2ZScpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi4kZWwuZmluZCgnbGkuYWN0aXZlJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICRwYXJlbnQuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIG1lZGlhdG9yLnB1Ymxpc2goJ29wdGlvbi1zZWxlY3RlZCcsIHsgZGF0ZTogJGEudGV4dCgpIH0pO1xuICB9KTtcbn07Il19
