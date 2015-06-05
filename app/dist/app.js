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
  var html = $("<div class=\"comments\">\n  <div class=\"well\">\n    <h4>Add a comment:</h4>\n    <form class=\"form\">\n      <div class=\"form-group\">\n        <input class=\"form-control add-comment-name\" placeholder=\"Name\">\n      </div>\n      <div class=\"form-group \">\n        <textarea class=\"form-control add-comment-text\" placeholder=\"Comment here...\" rows=\"3\"></textarea>\n      </div>\n      <button type=\"submit\" class=\"btn btn-primary btn-sm disabled\">Submit</button>\n    </form>\n  </div>\n  <hr>\n  <div class=\"comments-list\">\n  </div>\n</div>");
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
      jsonString = "{\n  \"date\": \"June 2015\",\n  \"posts\": [\n    {\n      \"id\": 6,\n      \"title\": \"The great post\",\n      \"timestamp\": \"June 1, 2015, at 3:00:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    },\n    {\n      \"id\": 7,\n      \"title\": \"The second great post\",\n      \"timestamp\": \"June 1, 2015, at 4:00:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    },\n    {\n      \"id\": 8,\n      \"title\": \"The third great post\",\n      \"timestamp\": \"June 1, 2015, at 5:00:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    } else if (this.opts.data.date == 'May 2015') {
      jsonString = "{\n  \"date\": \"May 2015\",\n  \"posts\": [\n    {\n      \"id\": 5,\n      \"title\": \"The great post\",\n      \"timestamp\": \"May 1, 2015, 3:00:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    } else if (this.opts.data.date == 'April 2015') {
      jsonString = "{\n  \"date\": \"April 2015\",\n  \"posts\": [\n    {\n      \"id\": 4,\n      \"title\": \"The great post\",\n      \"timestamp\": \"April 1, 2015, 3:00:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    } else if (this.opts.data.date == 'March 2015') {
      jsonString = "{\n  \"date\": \"March 2015\",\n  \"posts\": [\n    {\n      \"id\": 3,\n      \"title\": \"The great post\",\n      \"timestamp\": \"March 1, 2015, 3:00:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    } else if (this.opts.data.date == 'February 2015') {
      jsonString = "{\n  \"date\": \"February 2015\",\n  \"posts\": [\n    {\n      \"id\": 2,\n      \"title\": \"The great post\",\n      \"timestamp\": \"February 1, 2015, 3:00:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    } else if (this.opts.data.date == 'January 2015') {
      jsonString = "{\n  \"date\": \"January 2015\",\n  \"posts\": [\n    {\n      \"id\": 1,\n      \"title\": \"The great post\",\n      \"timestamp\": \"January 1, 2015, 3:00:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
    }
  } else if (this.opts.data.method == 'fetchComments') {
    jsonString = "[\n  {\n    \"name\": \"This guy\",\n    \"timestamp\": \"June 2, 2015, 4:00:00 PM\",\n    \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet.\"\n  },\n  {\n    \"name\": \"That guy\",\n    \"timestamp\": \"June 2, 2015, 4:00:00 PM\",\n    \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet.\"\n  }\n  ,\n  {\n    \"name\": \"Final guy\",\n    \"timestamp\": \"June 2, 2015, 4:00:00 PM\",\n    \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet.\"\n  }\n]";
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc3JjL21haW4uanMiLCJhcHAvc3JjL21vZHVsZXMvYmxvZy9ibG9nLmpzIiwiYXBwL3NyYy9tb2R1bGVzL2NvbW1lbnRzL2NvbW1lbnRzLmpzIiwiYXBwL3NyYy9tb2R1bGVzL21lZGlhdG9yL21lZGlhdG9yLmpzIiwiYXBwL3NyYy9tb2R1bGVzL21vY2tfYWpheC9tb2NrX2FqYXguanMiLCJhcHAvc3JjL21vZHVsZXMvb3ZlcmxheS9vdmVybGF5LmpzIiwiYXBwL3NyYy9tb2R1bGVzL3NpZGViYXIvc2lkZWJhci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG52YXIgbWVkaWF0b3IgPSByZXF1aXJlKCcuL21vZHVsZXMvbWVkaWF0b3IvbWVkaWF0b3InKTtcbnZhciBvdmVybGF5ID0gcmVxdWlyZSgnLi9tb2R1bGVzL292ZXJsYXkvb3ZlcmxheScpO1xudmFyIFNpZGViYXIgPSByZXF1aXJlKCcuL21vZHVsZXMvc2lkZWJhci9zaWRlYmFyJyk7XG52YXIgQmxvZyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9ibG9nL2Jsb2cnKTtcblxudmFyIGFwcGxpY2F0aW9uU3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgLy8gc2V0dXAgaW5pdGlhbCBwYWdlIHNrZWxldG9uXG4gIHZhciBodG1sID0gXCI8ZGl2IGlkPVxcXCJvdmVybGF5XFxcIj5cXG4gIDxkaXYgaWQ9XFxcImxvYWRlckltYWdlXFxcIj48L2Rpdj5cXG48L2Rpdj5cXG48ZGl2IGNsYXNzPVxcXCJjb250YWluZXItZmx1aWRcXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwicm93XFxcIj5cXG4gICAgPGRpdiBpZD1cXFwic2lkZWJhci1jb250YWluZXJcXFwiIGNsYXNzPVxcXCJjb2wteHMtMyBjb2wtbWQtMyBjb2wtbGctMlxcXCI+PC9kaXY+XFxuICAgIDxkaXYgaWQ9XFxcImJsb2ctY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiY29sLXhzLW9mZnNldC0zIGNvbC14cy05IGNvbC1tZC1vZmZzZXQtMyBjb2wtbWQtOCBjb2wtbGctb2Zmc2V0LTIgY29sLWxnLTEwXFxcIj48L2Rpdj5cXG4gIDwvZGl2PlxcbjwvZGl2PlwiO1xuICAkKCcjbWFpbi1wYWdlLWNvbnRlbnQnKS5odG1sKGh0bWwpO1xuXG4gIC8vIGluc3RhbnRpYXRlIG1vZHVsZXNcbiAgdmFyIHNpZGViYXIgPSBuZXcgU2lkZWJhcih7IHVybDogbnVsbCB9KTtcbiAgdmFyIGJsb2cgPSBuZXcgQmxvZyh7IHVybDogbnVsbCB9KTtcblxuICBvdmVybGF5LnNldENvbmZpZyh7XG4gICAgc3JjOiAnbGliL2ltYWdlcy9sb2FkaW5nLnBuZycsXG4gICAgd2lkdGg6IDE1MCxcbiAgICBoZWlnaHQ6IDE1MCxcbiAgICBpbWc6ICQoXCIjbG9hZGVySW1hZ2VcIiksXG4gICAgb3ZlcmxheTogJChcIiNvdmVybGF5XCIpLFxuICAgIGZyYW1lczogMTIsXG4gICAgaW50ZXJ2YWw6IDkwXG4gIH0pO1xuXG4gIC8vIGRpc3BsYXkgdGhlIG1vZHVsZXNcbiAgc2lkZWJhci5hcHBlbmRUbygnI3NpZGViYXItY29udGFpbmVyJyk7XG4gIGJsb2cuYXBwZW5kVG8oJyNibG9nLWNvbnRhaW5lcicpO1xuXG4gIG1lZGlhdG9yLnB1Ymxpc2goJ3BhZ2UtaW5pdCcsIHt9KTtcbn07XG5cbiQoZG9jdW1lbnQpLnJlYWR5KGFwcGxpY2F0aW9uU3RhcnQpOyIsIlxudmFyIG1lZGlhdG9yID0gcmVxdWlyZSgnLi4vbWVkaWF0b3IvbWVkaWF0b3InKTtcbnZhciBvdmVybGF5ID0gcmVxdWlyZSgnLi4vb3ZlcmxheS9vdmVybGF5Jyk7XG52YXIgTW9ja0FqYXggPSByZXF1aXJlKCcuLi9tb2NrX2FqYXgvbW9ja19hamF4Jyk7XG52YXIgQ29tbWVudHMgPSByZXF1aXJlKCcuLi9jb21tZW50cy9jb21tZW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2c7XG5cbmZ1bmN0aW9uIEJsb2cob3B0cykge1xuICB2YXIgaHRtbCA9IFwiPGRpdiBjbGFzcz1cXFwiYmxvZ1xcXCI+XFxuICA8aDEgY2xhc3M9XFxcInBhZ2UtaGVhZGVyXFxcIj5CbG9nIDxzbWFsbD48L3NtYWxsPjwvaDE+XFxuICA8ZGl2IGNsYXNzPVxcXCJwb3N0c1xcXCI+PC9kaXY+XFxuPC9kaXY+XCI7XG4gIHRoaXMuJGVsID0gJChodG1sKTtcbiAgdGhpcy51cmwgPSBvcHRzLnVybDtcbiAgdGhpcy5wb3N0c1RlbXBsYXRlID0gXy50ZW1wbGF0ZShcIjwlIF8uZWFjaChwb3N0cywgZnVuY3Rpb24ocG9zdCkgeyAlPlxcbiAgPGRpdiBjbGFzcz1cXFwicG9zdFxcXCI+XFxuICAgIDxoMiBjbGFzcz1cXFwicG9zdC10aXRsZVxcXCI+PCU9IHBvc3QudGl0bGUgJT48L2gyPlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJwb3N0LXRpbWVcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLXRpbWVcXFwiPjwvc3Bhbj4gPCU9IHBvc3QudGltZXN0YW1wICU+PC9kaXY+XFxuICAgIDxicj5cXG4gICAgPGRpdiBjbGFzcz1cXFwicG9zdC10ZXh0IHRydW5jXFxcIj48JT0gcG9zdC50ZXh0ICU+PC9kaXY+XFxuICAgIDxpbnB1dCBjbGFzcz1cXFwicG9zdC1pZFxcXCIgdHlwZT1cXFwiaGlkZGVuXFxcIiB2YWx1ZT1cXFwiPCU9IHBvc3QuaWQgJT5cXFwiPlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJwb3N0LWNvbW1lbnRzLWNvbnRhaW5lclxcXCI+XFxuICAgICAgPGhyPlxcbiAgICA8L2Rpdj5cXG4gICAgPGJ1dHRvbiBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1yZWFkLW1vcmVcXFwiPlJlYWQgbW9yZTwvYnV0dG9uPlxcbiAgPC9kaXY+XFxuICA8YnI+XFxuPCUgfSk7ICU+XCIpO1xuXG4gIHZhciBzZWxmID0gdGhpcztcblxuICBtZWRpYXRvci5zdWJzY3JpYmUoJ29wdGlvbi1zZWxlY3RlZCcsIGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICBzZWxmLmZldGNoQmxvZyhhcmdzLmRhdGUpO1xuICB9KTtcbn1cblxuQmxvZy5wcm90b3R5cGUuYXBwZW5kVG8gPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgJCh0YXJnZXQpLmFwcGVuZCh0aGlzLiRlbCk7XG59O1xuXG5CbG9nLnByb3RvdHlwZS5mZXRjaEJsb2cgPSBmdW5jdGlvbihkYXRlKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBvdmVybGF5LmRpc3BsYXkoKTtcblxuICAvLyB1c2UgYSBjdXN0b20gbW9jayBhamF4IG9iamVjdCwgbG9va3MgbGlrZSAkLmFqYXggc28gZWFzeSB0byBwbHVnaW4gdG8gcmVhbCBsaWJyYXJ5IGxhdGVyXG4gIHZhciByZXF1ZXN0ID0gbmV3IE1vY2tBamF4KHtcbiAgICB0eXBlOiAnZ2V0JyxcbiAgICB1cmw6IHRoaXMudXJsLFxuICAgIGRhdGE6IHsgbWV0aG9kOiAnZmV0Y2hCbG9nJywgZGF0ZTogZGF0ZSB9LFxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgfSk7XG5cbiAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgc2VsZi5zZXREYXRlKHJlc3BvbnNlLmRhdGUpO1xuICAgIHNlbGYuaW5zZXJ0UG9zdHMocmVzcG9uc2UucG9zdHMpO1xuICAgIG92ZXJsYXkucmVtb3ZlKCk7XG4gIH0pO1xuXG4gIHJlcXVlc3QuZmFpbChmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvcicpO1xuICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICBvdmVybGF5LnJlbW92ZSgpO1xuICB9KTtcbn07XG5cbkJsb2cucHJvdG90eXBlLnNldERhdGUgPSBmdW5jdGlvbihkYXRlKSB7XG4gIHRoaXMuJGVsLmZpbmQoJ2gxID4gc21hbGwnKS5odG1sKGRhdGUpO1xufTtcblxuQmxvZy5wcm90b3R5cGUuaW5zZXJ0UG9zdHMgPSBmdW5jdGlvbihwb3N0cykge1xuICB2YXIgaHRtbCA9IHRoaXMucG9zdHNUZW1wbGF0ZSh7IHBvc3RzOiBwb3N0cyB9KTtcbiAgdGhpcy4kZWwuZmluZCgnLnBvc3RzJykuaHRtbChodG1sKTtcblxuICB0aGlzLiRlbC5maW5kKCcuYnRuLXJlYWQtbW9yZScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgdmFyICRjb21tZW50cyA9ICR0aGlzLnNpYmxpbmdzKCcucG9zdC1jb21tZW50cy1jb250YWluZXInKTtcbiAgICBcbiAgICAkdGhpcy5zaWJsaW5ncygnLnBvc3QtdGV4dCcpLnJlbW92ZUNsYXNzKCd0cnVuYycpO1xuXG4gICAgbmV3IENvbW1lbnRzKHtcbiAgICAgIHVybDogbnVsbCxcbiAgICAgICR0YXJnZXQ6ICRjb21tZW50cyxcbiAgICAgIGlkOiAkdGhpcy5zaWJsaW5ncygnLnBvc3QtaWQnKS52YWwoKVxuICAgIH0pLmFwcGVuZFRvKCRjb21tZW50cyk7XG4gICAgXG4gICAgJGNvbW1lbnRzLnNob3coKTtcblxuICAgICR0aGlzLnJlbW92ZSgpO1xuICB9KTtcbn07IiwiXG52YXIgb3ZlcmxheSA9IHJlcXVpcmUoJy4uL292ZXJsYXkvb3ZlcmxheScpO1xudmFyIE1vY2tBamF4ID0gcmVxdWlyZSgnLi4vbW9ja19hamF4L21vY2tfYWpheCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbW1lbnRzO1xuXG5mdW5jdGlvbiBDb21tZW50cyhvcHRzKSB7XG4gIHZhciBodG1sID0gJChcIjxkaXYgY2xhc3M9XFxcImNvbW1lbnRzXFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcIndlbGxcXFwiPlxcbiAgICA8aDQ+QWRkIGEgY29tbWVudDo8L2g0PlxcbiAgICA8Zm9ybSBjbGFzcz1cXFwiZm9ybVxcXCI+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cFxcXCI+XFxuICAgICAgICA8aW5wdXQgY2xhc3M9XFxcImZvcm0tY29udHJvbCBhZGQtY29tbWVudC1uYW1lXFxcIiBwbGFjZWhvbGRlcj1cXFwiTmFtZVxcXCI+XFxuICAgICAgPC9kaXY+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBcXFwiPlxcbiAgICAgICAgPHRleHRhcmVhIGNsYXNzPVxcXCJmb3JtLWNvbnRyb2wgYWRkLWNvbW1lbnQtdGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIkNvbW1lbnQgaGVyZS4uLlxcXCIgcm93cz1cXFwiM1xcXCI+PC90ZXh0YXJlYT5cXG4gICAgICA8L2Rpdj5cXG4gICAgICA8YnV0dG9uIHR5cGU9XFxcInN1Ym1pdFxcXCIgY2xhc3M9XFxcImJ0biBidG4tcHJpbWFyeSBidG4tc20gZGlzYWJsZWRcXFwiPlN1Ym1pdDwvYnV0dG9uPlxcbiAgICA8L2Zvcm0+XFxuICA8L2Rpdj5cXG4gIDxocj5cXG4gIDxkaXYgY2xhc3M9XFxcImNvbW1lbnRzLWxpc3RcXFwiPlxcbiAgPC9kaXY+XFxuPC9kaXY+XCIpO1xuICB0aGlzLiRlbCA9ICQoaHRtbCk7XG4gIHRoaXMudXJsID0gb3B0cy51cmw7XG4gIHRoaXMuJHRhcmdldCA9IG9wdHMuJHRhcmdldDtcbiAgdGhpcy5wb3N0SWQgPSBvcHRzLmlkO1xuICB0aGlzLmNvbW1lbnRUZW1wbGF0ZSA9IF8udGVtcGxhdGUoXCI8ZGl2IGNsYXNzPVxcXCJjb21tZW50XFxcIj5cXG4gIDxkaXY+XFxuICAgIDxpbWcgY2xhc3M9XFxcInB1bGwtbGVmdFxcXCIgc3JjPVxcXCJsaWIvaW1hZ2VzL3BsYWNlaG9sZGVyLnBuZ1xcXCI+XFxuICAgIDxoND48JT0gY29tbWVudC5uYW1lLmxlbmd0aCA/IGNvbW1lbnQubmFtZSA6ICdBbm9ueW1vdXMnICU+IDxzbWFsbCBjbGFzcz1cXFwicHVsbC1yaWdodFxcXCI+PCU9IGNvbW1lbnQudGltZXN0YW1wICU+PC9zbWFsbD48L2g0PlxcbiAgPC9kaXY+XFxuICA8c3BhbiBjbGFzcz1cXFwiY29tbWVudC10ZXh0XFxcIj5cXG4gICAgPCU9IGNvbW1lbnQudGV4dCAlPlxcbiAgPC9zcGFuPlxcbjwvZGl2Plxcbjxicj5cXG48YnI+XCIpO1xuXG4gIHRoaXMuZmV0Y2hDb21tZW50cyh0aGlzLnBvc3RJZCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbkNvbW1lbnRzLnByb3RvdHlwZS5hcHBlbmRUbyA9IGZ1bmN0aW9uKCR0YXJnZXQpIHtcbiAgJHRhcmdldC5hcHBlbmQodGhpcy4kZWwpO1xufTtcblxuQ29tbWVudHMucHJvdG90eXBlLmZldGNoQ29tbWVudHMgPSBmdW5jdGlvbihpZCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgb3ZlcmxheS5kaXNwbGF5KCk7XG5cbiAgLy8gdXNlIGEgY3VzdG9tIG1vY2sgYWpheCBvYmplY3QsIGxvb2tzIGxpa2UgJC5hamF4IHNvIGVhc3kgdG8gcGx1Z2luIHRvIHJlYWwgbGlicmFyeSBsYXRlclxuICB2YXIgcmVxdWVzdCA9IG5ldyBNb2NrQWpheCh7XG4gICAgdHlwZTogJ2dldCcsXG4gICAgdXJsOiB0aGlzLnVybCxcbiAgICBkYXRhOiB7IG1ldGhvZDogJ2ZldGNoQ29tbWVudHMnLCBpZDogaWQgfSxcbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gIH0pO1xuXG4gIHJlcXVlc3QuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIHNlbGYuaW5zZXJ0Q29tbWVudHMocmVzcG9uc2UpO1xuICAgIG92ZXJsYXkucmVtb3ZlKCk7XG4gIH0pO1xuXG4gIHJlcXVlc3QuZmFpbChmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvcicpO1xuICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICBvdmVybGF5LnJlbW92ZSgpO1xuICB9KTtcbn07XG5cbkNvbW1lbnRzLnByb3RvdHlwZS5pbnNlcnRDb21tZW50cyA9IGZ1bmN0aW9uKGNvbW1lbnRzKSB7XG4gIHZhciBodG1sID0gXCJcIjtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICQuZWFjaChjb21tZW50cywgZnVuY3Rpb24oaSwgY29tbWVudCkge1xuICAgIGh0bWwgKz0gc2VsZi5jb21tZW50VGVtcGxhdGUoeyBjb21tZW50OiBjb21tZW50IH0pO1xuICB9KTtcblxuICB0aGlzLiRlbC5maW5kKCcuY29tbWVudHMtbGlzdCcpLmFwcGVuZChodG1sKTtcblxuICB0aGlzLiRlbC5maW5kKCdmb3JtIC5hZGQtY29tbWVudC10ZXh0Jykua2V5dXAoZnVuY3Rpb24oKSB7XG4gICAgaWYgKCQodGhpcykudmFsKCkubGVuZ3RoKSB7XG4gICAgICBzZWxmLiRlbC5maW5kKCdmb3JtIC5idG4tcHJpbWFyeS5kaXNhYmxlZCcpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLiRlbC5maW5kKCdmb3JtIC5idG4tcHJpbWFyeScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgIH1cbiAgfSk7XG5cbiAgdGhpcy4kZWwuZmluZCgnZm9ybScpLnN1Ym1pdChmdW5jdGlvbihlKSB7XG4gICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICBpZiAoISR0aGlzLmZpbmQoJy5hZGQtY29tbWVudC10ZXh0JykudmFsKCkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc2VsZi5wb3N0Q29tbWVudChcbiAgICAgIHNlbGYucG9zdElkLFxuICAgICAgc2VsZi4kZWwuZmluZCgnZm9ybSAuYWRkLWNvbW1lbnQtbmFtZScpLnZhbCgpLFxuICAgICAgc2VsZi4kZWwuZmluZCgnZm9ybSAuYWRkLWNvbW1lbnQtdGV4dCcpLnZhbCgpXG4gICAgKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xufTtcblxuQ29tbWVudHMucHJvdG90eXBlLnBvc3RDb21tZW50ID0gZnVuY3Rpb24oaWQsIG5hbWUsIHRleHQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIG92ZXJsYXkuZGlzcGxheSgpO1xuXG4gIC8vIHVzZSBhIGN1c3RvbSBtb2NrIGFqYXggb2JqZWN0LCBsb29rcyBsaWtlICQuYWpheCBzbyBlYXN5IHRvIHBsdWdpbiB0byByZWFsIGxpYnJhcnkgbGF0ZXJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgTW9ja0FqYXgoe1xuICAgIHR5cGU6ICdwb3N0JyxcbiAgICB1cmw6IHRoaXMudXJsLFxuICAgIGRhdGE6IHsgbWV0aG9kOiAncG9zdENvbW1lbnQnLCBpZDogaWQsIG5hbWU6IG5hbWUsIHRleHQ6IHRleHQgfSxcbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gIH0pO1xuXG4gIHJlcXVlc3QuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICBzZWxmLiRlbC5maW5kKCcuYWRkLWNvbW1lbnQtdGV4dCwuYWRkLWNvbW1lbnQtbmFtZScpLnZhbCgnJyk7XG4gICAgICBzZWxmLiRlbC5maW5kKCcuZm9ybSAuYnRuLXByaW1hcnknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcblxuICAgICAgdmFyIGh0bWwgPSBzZWxmLmNvbW1lbnRUZW1wbGF0ZSh7XG4gICAgICAgIGNvbW1lbnQ6IHtcbiAgICAgICAgICBuYW1lOiBfLmVzY2FwZShuYW1lKSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKCdlbi1VUycsIHsgeWVhcjogJ251bWVyaWMnLCBtb250aDogJ2xvbmcnLCBkYXk6ICdudW1lcmljJyB9KSxcbiAgICAgICAgICB0ZXh0OiBfLmVzY2FwZSh0ZXh0KVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2VsZi4kZWwuZmluZCgnLmNvbW1lbnRzLWxpc3QnKS5wcmVwZW5kKGh0bWwpO1xuICAgIH1cblxuICAgIG92ZXJsYXkucmVtb3ZlKCk7XG4gIH0pO1xuXG4gIHJlcXVlc3QuZmFpbChmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvcicpO1xuICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICBvdmVybGF5LnJlbW92ZSgpO1xuICB9KTtcbn07IiwiLy8gaW5zdGFudGlhdGUgTWVkaWF0b3IgaGVyZSwgKiBzaW5nbGV0b24gKlxubW9kdWxlLmV4cG9ydHMgPSBuZXcgTWVkaWF0b3IoKTtcblxuZnVuY3Rpb24gTWVkaWF0b3IoKSB7XG4gIHRoaXMuZXZlbnRzID0ge307XG4gIHJldHVybiB0aGlzO1xufVxuXG5NZWRpYXRvci5wcm90b3R5cGUucHVibGlzaCA9IGZ1bmN0aW9uKG1zZywgZGF0YSkge1xuICBpZiAodGhpcy5ldmVudHNbbXNnXSkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5ldmVudHNbbXNnXS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHRoaXMuZXZlbnRzW21zZ11baV0oZGF0YSk7XG4gICAgfVxuICB9XG59O1xuXG5NZWRpYXRvci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24obXNnLCBmKSB7XG4gIGlmICghdGhpcy5ldmVudHNbbXNnXSkge1xuICAgIHRoaXMuZXZlbnRzW21zZ10gPSBbXTtcbiAgfVxuXG4gIHRoaXMuZXZlbnRzW21zZ10ucHVzaChmKTtcbn07XG4iLCJcblxubW9kdWxlLmV4cG9ydHMgPSBNb2NrQWpheDtcblxuZnVuY3Rpb24gTW9ja0FqYXgob3B0cykge1xuICB0aGlzLm9wdHMgPSBvcHRzO1xuICB0aGlzLnJlc3BvbnNlID0gbnVsbDtcbiAgdGhpcy5kb25lUHJvbWlzZSA9IG51bGw7XG4gIHRoaXMuZmFpbFByb21pc2UgPSBudWxsO1xuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGpzb25TdHJpbmcgPSBcIlwiO1xuXG4gIC8vIHRoaXMgcGFydCBpcyBqdXN0IHRvIGJyaW5nIGluIG1vY2sgZGF0YSBkZXBlbmRpbmcgb24gdGhlIHJlcXVlc3RcbiAgaWYgKHRoaXMub3B0cy5kYXRhLm1ldGhvZCA9PSAnZmV0Y2hPcHRpb25zJykge1xuICAgIGpzb25TdHJpbmcgPSBcIltcXG4gIFxcXCJKdW5lIDIwMTVcXFwiLFxcbiAgXFxcIk1heSAyMDE1XFxcIixcXG4gIFxcXCJBcHJpbCAyMDE1XFxcIixcXG4gIFxcXCJNYXJjaCAyMDE1XFxcIixcXG4gIFxcXCJGZWJydWFyeSAyMDE1XFxcIixcXG4gIFxcXCJKYW51YXJ5IDIwMTVcXFwiXFxuXVwiO1xuICB9IGVsc2UgaWYgKHRoaXMub3B0cy5kYXRhLm1ldGhvZCA9PSAnZmV0Y2hCbG9nJykge1xuICAgIGlmICh0aGlzLm9wdHMuZGF0YS5kYXRlID09ICdKdW5lIDIwMTUnKSB7XG4gICAgICBqc29uU3RyaW5nID0gXCJ7XFxuICBcXFwiZGF0ZVxcXCI6IFxcXCJKdW5lIDIwMTVcXFwiLFxcbiAgXFxcInBvc3RzXFxcIjogW1xcbiAgICB7XFxuICAgICAgXFxcImlkXFxcIjogNixcXG4gICAgICBcXFwidGl0bGVcXFwiOiBcXFwiVGhlIGdyZWF0IHBvc3RcXFwiLFxcbiAgICAgIFxcXCJ0aW1lc3RhbXBcXFwiOiBcXFwiSnVuZSAxLCAyMDE1LCBhdCAzOjAwOjAwIFBNXFxcIixcXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuIE1vcmJpIGNvbmRpbWVudHVtIGNvbmd1ZSB2ZWhpY3VsYS4gRnVzY2UgdGluY2lkdW50IGVuaW0gdGVsbHVzLCBlZ2V0IHBvcnRhIGF1Z3VlIHRlbXBvciB1bHRyaWNlcy4gUGVsbGVudGVzcXVlIHN1c2NpcGl0IG9yY2kgaWQgbWF1cmlzIHBvc3VlcmUsIG5lYyBpYWN1bGlzIHR1cnBpcyBpYWN1bGlzLiBQcmFlc2VudCBtYXR0aXMgZW5pbSBpZCBkdWkgbWF4aW11cywgZXUgY29uc2VxdWF0IGR1aSB0cmlzdGlxdWUuIE51bGxhbSBtYXhpbXVzIG5pYmggYXQgZXggbWF0dGlzLCBuZWMgdmVzdGlidWx1bSBlcm9zIG1heGltdXMuIFBlbGxlbnRlc3F1ZSBxdWlzIGZldWdpYXQgZXJvcy4gTnVsbGFtIHZpdGFlIGZyaW5naWxsYSBsZWN0dXMsIGF0IGZhdWNpYnVzIG1pLiBTdXNwZW5kaXNzZSB2ZWwgdml2ZXJyYSBuaWJoLiBWZXN0aWJ1bHVtIGNvbmd1ZSB1cm5hIGVnZXQgdmVsaXQgbGFvcmVldCwgbm9uIGRpZ25pc3NpbSBwdXJ1cyBmYXVjaWJ1cy4gSW50ZWdlciBub24gc2FnaXR0aXMgbnVsbGEuIER1aXMgdXQgdHJpc3RpcXVlIG1pLCBzZWQgc2NlbGVyaXNxdWUgZXN0LiBWaXZhbXVzIHNhcGllbiBzZW0sIGZhdWNpYnVzIGV0IGZhdWNpYnVzIGFjLCBmYWNpbGlzaXMgYSBsZW8uIE51bmMgaW4gc2VtIGxpYmVyby4gXFxcXG5TZWQgbW9sbGlzIHVybmEgYWMgZWdlc3RhcyB2aXZlcnJhLiBVdCBpbiBkb2xvciBldCBqdXN0byBpYWN1bGlzIGRpZ25pc3NpbS4gTnVsbGEgcGVsbGVudGVzcXVlIGxvcmVtIGV0IHRlbGx1cyBsYWNpbmlhLCBzZWQgZ3JhdmlkYSBkdWkgbWF0dGlzLiBDcmFzIHBvc3VlcmUsIGVyYXQgaW4gdGluY2lkdW50IGRpZ25pc3NpbSwgb3JjaSBudW5jIGx1Y3R1cyBkaWFtLCB2ZWwgdWx0cmljaWVzIHNhcGllbiBkaWFtIGlkIG1ldHVzLiBOdW5jIGF1Y3RvciwgbGVjdHVzIHNlZCBydXRydW0gaGVuZHJlcml0LCB1cm5hIG9yY2kgY29uZ3VlIGxpYmVybywgZXUgc2NlbGVyaXNxdWUgcmlzdXMgZmVsaXMgZWdldCB1cm5hLiBWaXZhbXVzIG1vbGxpcyBmZWxpcyBlbmltLCB0aW5jaWR1bnQgY3Vyc3VzIHF1YW0gZ3JhdmlkYSBmcmluZ2lsbGEuIFBoYXNlbGx1cyBtYWxlc3VhZGEgYSBlc3QgZWdldCBldWlzbW9kLiBQcmFlc2VudCB2ZW5lbmF0aXMgbGVvIHZpdGFlIGF1Z3VlIHBvcnR0aXRvciBzY2VsZXJpc3F1ZS4gRG9uZWMgaW1wZXJkaWV0LCBvZGlvLlxcXCJcXG4gICAgfSxcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDcsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBzZWNvbmQgZ3JlYXQgcG9zdFxcXCIsXFxuICAgICAgXFxcInRpbWVzdGFtcFxcXCI6IFxcXCJKdW5lIDEsIDIwMTUsIGF0IDQ6MDA6MDAgUE1cXFwiLFxcbiAgICAgIFxcXCJ0ZXh0XFxcIjogXFxcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIE51bGxhbSBzZW1wZXIgbWF1cmlzIGFjIGp1c3RvIHRlbXBvciBjb25zZWN0ZXR1ci4gTW9yYmkgcmhvbmN1cyBpYWN1bGlzIGlwc3VtIGlkIGNvbmRpbWVudHVtLiBEb25lYyBmYXVjaWJ1cyBsZW8gc2NlbGVyaXNxdWUgc2NlbGVyaXNxdWUgYWxpcXVldC4gTW9yYmkgY29uZGltZW50dW0gY29uZ3VlIHZlaGljdWxhLiBGdXNjZSB0aW5jaWR1bnQgZW5pbSB0ZWxsdXMsIGVnZXQgcG9ydGEgYXVndWUgdGVtcG9yIHVsdHJpY2VzLiBQZWxsZW50ZXNxdWUgc3VzY2lwaXQgb3JjaSBpZCBtYXVyaXMgcG9zdWVyZSwgbmVjIGlhY3VsaXMgdHVycGlzIGlhY3VsaXMuIFByYWVzZW50IG1hdHRpcyBlbmltIGlkIGR1aSBtYXhpbXVzLCBldSBjb25zZXF1YXQgZHVpIHRyaXN0aXF1ZS4gTnVsbGFtIG1heGltdXMgbmliaCBhdCBleCBtYXR0aXMsIG5lYyB2ZXN0aWJ1bHVtIGVyb3MgbWF4aW11cy4gUGVsbGVudGVzcXVlIHF1aXMgZmV1Z2lhdCBlcm9zLiBOdWxsYW0gdml0YWUgZnJpbmdpbGxhIGxlY3R1cywgYXQgZmF1Y2lidXMgbWkuIFN1c3BlbmRpc3NlIHZlbCB2aXZlcnJhIG5pYmguIFZlc3RpYnVsdW0gY29uZ3VlIHVybmEgZWdldCB2ZWxpdCBsYW9yZWV0LCBub24gZGlnbmlzc2ltIHB1cnVzIGZhdWNpYnVzLiBJbnRlZ2VyIG5vbiBzYWdpdHRpcyBudWxsYS4gRHVpcyB1dCB0cmlzdGlxdWUgbWksIHNlZCBzY2VsZXJpc3F1ZSBlc3QuIFZpdmFtdXMgc2FwaWVuIHNlbSwgZmF1Y2lidXMgZXQgZmF1Y2lidXMgYWMsIGZhY2lsaXNpcyBhIGxlby4gTnVuYyBpbiBzZW0gbGliZXJvLiBcXFxcblNlZCBtb2xsaXMgdXJuYSBhYyBlZ2VzdGFzIHZpdmVycmEuIFV0IGluIGRvbG9yIGV0IGp1c3RvIGlhY3VsaXMgZGlnbmlzc2ltLiBOdWxsYSBwZWxsZW50ZXNxdWUgbG9yZW0gZXQgdGVsbHVzIGxhY2luaWEsIHNlZCBncmF2aWRhIGR1aSBtYXR0aXMuIENyYXMgcG9zdWVyZSwgZXJhdCBpbiB0aW5jaWR1bnQgZGlnbmlzc2ltLCBvcmNpIG51bmMgbHVjdHVzIGRpYW0sIHZlbCB1bHRyaWNpZXMgc2FwaWVuIGRpYW0gaWQgbWV0dXMuIE51bmMgYXVjdG9yLCBsZWN0dXMgc2VkIHJ1dHJ1bSBoZW5kcmVyaXQsIHVybmEgb3JjaSBjb25ndWUgbGliZXJvLCBldSBzY2VsZXJpc3F1ZSByaXN1cyBmZWxpcyBlZ2V0IHVybmEuIFZpdmFtdXMgbW9sbGlzIGZlbGlzIGVuaW0sIHRpbmNpZHVudCBjdXJzdXMgcXVhbSBncmF2aWRhIGZyaW5naWxsYS4gUGhhc2VsbHVzIG1hbGVzdWFkYSBhIGVzdCBlZ2V0IGV1aXNtb2QuIFByYWVzZW50IHZlbmVuYXRpcyBsZW8gdml0YWUgYXVndWUgcG9ydHRpdG9yIHNjZWxlcmlzcXVlLiBEb25lYyBpbXBlcmRpZXQsIG9kaW8uXFxcIlxcbiAgICB9LFxcbiAgICB7XFxuICAgICAgXFxcImlkXFxcIjogOCxcXG4gICAgICBcXFwidGl0bGVcXFwiOiBcXFwiVGhlIHRoaXJkIGdyZWF0IHBvc3RcXFwiLFxcbiAgICAgIFxcXCJ0aW1lc3RhbXBcXFwiOiBcXFwiSnVuZSAxLCAyMDE1LCBhdCA1OjAwOjAwIFBNXFxcIixcXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuIE1vcmJpIGNvbmRpbWVudHVtIGNvbmd1ZSB2ZWhpY3VsYS4gRnVzY2UgdGluY2lkdW50IGVuaW0gdGVsbHVzLCBlZ2V0IHBvcnRhIGF1Z3VlIHRlbXBvciB1bHRyaWNlcy4gUGVsbGVudGVzcXVlIHN1c2NpcGl0IG9yY2kgaWQgbWF1cmlzIHBvc3VlcmUsIG5lYyBpYWN1bGlzIHR1cnBpcyBpYWN1bGlzLiBQcmFlc2VudCBtYXR0aXMgZW5pbSBpZCBkdWkgbWF4aW11cywgZXUgY29uc2VxdWF0IGR1aSB0cmlzdGlxdWUuIE51bGxhbSBtYXhpbXVzIG5pYmggYXQgZXggbWF0dGlzLCBuZWMgdmVzdGlidWx1bSBlcm9zIG1heGltdXMuIFBlbGxlbnRlc3F1ZSBxdWlzIGZldWdpYXQgZXJvcy4gTnVsbGFtIHZpdGFlIGZyaW5naWxsYSBsZWN0dXMsIGF0IGZhdWNpYnVzIG1pLiBTdXNwZW5kaXNzZSB2ZWwgdml2ZXJyYSBuaWJoLiBWZXN0aWJ1bHVtIGNvbmd1ZSB1cm5hIGVnZXQgdmVsaXQgbGFvcmVldCwgbm9uIGRpZ25pc3NpbSBwdXJ1cyBmYXVjaWJ1cy4gSW50ZWdlciBub24gc2FnaXR0aXMgbnVsbGEuIER1aXMgdXQgdHJpc3RpcXVlIG1pLCBzZWQgc2NlbGVyaXNxdWUgZXN0LiBWaXZhbXVzIHNhcGllbiBzZW0sIGZhdWNpYnVzIGV0IGZhdWNpYnVzIGFjLCBmYWNpbGlzaXMgYSBsZW8uIE51bmMgaW4gc2VtIGxpYmVyby4gXFxcXG5TZWQgbW9sbGlzIHVybmEgYWMgZWdlc3RhcyB2aXZlcnJhLiBVdCBpbiBkb2xvciBldCBqdXN0byBpYWN1bGlzIGRpZ25pc3NpbS4gTnVsbGEgcGVsbGVudGVzcXVlIGxvcmVtIGV0IHRlbGx1cyBsYWNpbmlhLCBzZWQgZ3JhdmlkYSBkdWkgbWF0dGlzLiBDcmFzIHBvc3VlcmUsIGVyYXQgaW4gdGluY2lkdW50IGRpZ25pc3NpbSwgb3JjaSBudW5jIGx1Y3R1cyBkaWFtLCB2ZWwgdWx0cmljaWVzIHNhcGllbiBkaWFtIGlkIG1ldHVzLiBOdW5jIGF1Y3RvciwgbGVjdHVzIHNlZCBydXRydW0gaGVuZHJlcml0LCB1cm5hIG9yY2kgY29uZ3VlIGxpYmVybywgZXUgc2NlbGVyaXNxdWUgcmlzdXMgZmVsaXMgZWdldCB1cm5hLiBWaXZhbXVzIG1vbGxpcyBmZWxpcyBlbmltLCB0aW5jaWR1bnQgY3Vyc3VzIHF1YW0gZ3JhdmlkYSBmcmluZ2lsbGEuIFBoYXNlbGx1cyBtYWxlc3VhZGEgYSBlc3QgZWdldCBldWlzbW9kLiBQcmFlc2VudCB2ZW5lbmF0aXMgbGVvIHZpdGFlIGF1Z3VlIHBvcnR0aXRvciBzY2VsZXJpc3F1ZS4gRG9uZWMgaW1wZXJkaWV0LCBvZGlvLlxcXCJcXG4gICAgfVxcbiAgXVxcbn1cIjtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0cy5kYXRhLmRhdGUgPT0gJ01heSAyMDE1Jykge1xuICAgICAganNvblN0cmluZyA9IFwie1xcbiAgXFxcImRhdGVcXFwiOiBcXFwiTWF5IDIwMTVcXFwiLFxcbiAgXFxcInBvc3RzXFxcIjogW1xcbiAgICB7XFxuICAgICAgXFxcImlkXFxcIjogNSxcXG4gICAgICBcXFwidGl0bGVcXFwiOiBcXFwiVGhlIGdyZWF0IHBvc3RcXFwiLFxcbiAgICAgIFxcXCJ0aW1lc3RhbXBcXFwiOiBcXFwiTWF5IDEsIDIwMTUsIDM6MDA6MDAgUE1cXFwiLFxcbiAgICAgIFxcXCJ0ZXh0XFxcIjogXFxcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIE51bGxhbSBzZW1wZXIgbWF1cmlzIGFjIGp1c3RvIHRlbXBvciBjb25zZWN0ZXR1ci4gTW9yYmkgcmhvbmN1cyBpYWN1bGlzIGlwc3VtIGlkIGNvbmRpbWVudHVtLiBEb25lYyBmYXVjaWJ1cyBsZW8gc2NlbGVyaXNxdWUgc2NlbGVyaXNxdWUgYWxpcXVldC4gTW9yYmkgY29uZGltZW50dW0gY29uZ3VlIHZlaGljdWxhLiBGdXNjZSB0aW5jaWR1bnQgZW5pbSB0ZWxsdXMsIGVnZXQgcG9ydGEgYXVndWUgdGVtcG9yIHVsdHJpY2VzLiBQZWxsZW50ZXNxdWUgc3VzY2lwaXQgb3JjaSBpZCBtYXVyaXMgcG9zdWVyZSwgbmVjIGlhY3VsaXMgdHVycGlzIGlhY3VsaXMuIFByYWVzZW50IG1hdHRpcyBlbmltIGlkIGR1aSBtYXhpbXVzLCBldSBjb25zZXF1YXQgZHVpIHRyaXN0aXF1ZS4gTnVsbGFtIG1heGltdXMgbmliaCBhdCBleCBtYXR0aXMsIG5lYyB2ZXN0aWJ1bHVtIGVyb3MgbWF4aW11cy4gUGVsbGVudGVzcXVlIHF1aXMgZmV1Z2lhdCBlcm9zLiBOdWxsYW0gdml0YWUgZnJpbmdpbGxhIGxlY3R1cywgYXQgZmF1Y2lidXMgbWkuIFN1c3BlbmRpc3NlIHZlbCB2aXZlcnJhIG5pYmguIFZlc3RpYnVsdW0gY29uZ3VlIHVybmEgZWdldCB2ZWxpdCBsYW9yZWV0LCBub24gZGlnbmlzc2ltIHB1cnVzIGZhdWNpYnVzLiBJbnRlZ2VyIG5vbiBzYWdpdHRpcyBudWxsYS4gRHVpcyB1dCB0cmlzdGlxdWUgbWksIHNlZCBzY2VsZXJpc3F1ZSBlc3QuIFZpdmFtdXMgc2FwaWVuIHNlbSwgZmF1Y2lidXMgZXQgZmF1Y2lidXMgYWMsIGZhY2lsaXNpcyBhIGxlby4gTnVuYyBpbiBzZW0gbGliZXJvLiBcXFxcblNlZCBtb2xsaXMgdXJuYSBhYyBlZ2VzdGFzIHZpdmVycmEuIFV0IGluIGRvbG9yIGV0IGp1c3RvIGlhY3VsaXMgZGlnbmlzc2ltLiBOdWxsYSBwZWxsZW50ZXNxdWUgbG9yZW0gZXQgdGVsbHVzIGxhY2luaWEsIHNlZCBncmF2aWRhIGR1aSBtYXR0aXMuIENyYXMgcG9zdWVyZSwgZXJhdCBpbiB0aW5jaWR1bnQgZGlnbmlzc2ltLCBvcmNpIG51bmMgbHVjdHVzIGRpYW0sIHZlbCB1bHRyaWNpZXMgc2FwaWVuIGRpYW0gaWQgbWV0dXMuIE51bmMgYXVjdG9yLCBsZWN0dXMgc2VkIHJ1dHJ1bSBoZW5kcmVyaXQsIHVybmEgb3JjaSBjb25ndWUgbGliZXJvLCBldSBzY2VsZXJpc3F1ZSByaXN1cyBmZWxpcyBlZ2V0IHVybmEuIFZpdmFtdXMgbW9sbGlzIGZlbGlzIGVuaW0sIHRpbmNpZHVudCBjdXJzdXMgcXVhbSBncmF2aWRhIGZyaW5naWxsYS4gUGhhc2VsbHVzIG1hbGVzdWFkYSBhIGVzdCBlZ2V0IGV1aXNtb2QuIFByYWVzZW50IHZlbmVuYXRpcyBsZW8gdml0YWUgYXVndWUgcG9ydHRpdG9yIHNjZWxlcmlzcXVlLiBEb25lYyBpbXBlcmRpZXQsIG9kaW8uXFxcIlxcbiAgICB9XFxuICBdXFxufVwiO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRzLmRhdGEuZGF0ZSA9PSAnQXByaWwgMjAxNScpIHtcbiAgICAgIGpzb25TdHJpbmcgPSBcIntcXG4gIFxcXCJkYXRlXFxcIjogXFxcIkFwcmlsIDIwMTVcXFwiLFxcbiAgXFxcInBvc3RzXFxcIjogW1xcbiAgICB7XFxuICAgICAgXFxcImlkXFxcIjogNCxcXG4gICAgICBcXFwidGl0bGVcXFwiOiBcXFwiVGhlIGdyZWF0IHBvc3RcXFwiLFxcbiAgICAgIFxcXCJ0aW1lc3RhbXBcXFwiOiBcXFwiQXByaWwgMSwgMjAxNSwgMzowMDowMCBQTVxcXCIsXFxuICAgICAgXFxcInRleHRcXFwiOiBcXFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdC4gTnVsbGFtIHNlbXBlciBtYXVyaXMgYWMganVzdG8gdGVtcG9yIGNvbnNlY3RldHVyLiBNb3JiaSByaG9uY3VzIGlhY3VsaXMgaXBzdW0gaWQgY29uZGltZW50dW0uIERvbmVjIGZhdWNpYnVzIGxlbyBzY2VsZXJpc3F1ZSBzY2VsZXJpc3F1ZSBhbGlxdWV0LiBNb3JiaSBjb25kaW1lbnR1bSBjb25ndWUgdmVoaWN1bGEuIEZ1c2NlIHRpbmNpZHVudCBlbmltIHRlbGx1cywgZWdldCBwb3J0YSBhdWd1ZSB0ZW1wb3IgdWx0cmljZXMuIFBlbGxlbnRlc3F1ZSBzdXNjaXBpdCBvcmNpIGlkIG1hdXJpcyBwb3N1ZXJlLCBuZWMgaWFjdWxpcyB0dXJwaXMgaWFjdWxpcy4gUHJhZXNlbnQgbWF0dGlzIGVuaW0gaWQgZHVpIG1heGltdXMsIGV1IGNvbnNlcXVhdCBkdWkgdHJpc3RpcXVlLiBOdWxsYW0gbWF4aW11cyBuaWJoIGF0IGV4IG1hdHRpcywgbmVjIHZlc3RpYnVsdW0gZXJvcyBtYXhpbXVzLiBQZWxsZW50ZXNxdWUgcXVpcyBmZXVnaWF0IGVyb3MuIE51bGxhbSB2aXRhZSBmcmluZ2lsbGEgbGVjdHVzLCBhdCBmYXVjaWJ1cyBtaS4gU3VzcGVuZGlzc2UgdmVsIHZpdmVycmEgbmliaC4gVmVzdGlidWx1bSBjb25ndWUgdXJuYSBlZ2V0IHZlbGl0IGxhb3JlZXQsIG5vbiBkaWduaXNzaW0gcHVydXMgZmF1Y2lidXMuIEludGVnZXIgbm9uIHNhZ2l0dGlzIG51bGxhLiBEdWlzIHV0IHRyaXN0aXF1ZSBtaSwgc2VkIHNjZWxlcmlzcXVlIGVzdC4gVml2YW11cyBzYXBpZW4gc2VtLCBmYXVjaWJ1cyBldCBmYXVjaWJ1cyBhYywgZmFjaWxpc2lzIGEgbGVvLiBOdW5jIGluIHNlbSBsaWJlcm8uIFxcXFxuU2VkIG1vbGxpcyB1cm5hIGFjIGVnZXN0YXMgdml2ZXJyYS4gVXQgaW4gZG9sb3IgZXQganVzdG8gaWFjdWxpcyBkaWduaXNzaW0uIE51bGxhIHBlbGxlbnRlc3F1ZSBsb3JlbSBldCB0ZWxsdXMgbGFjaW5pYSwgc2VkIGdyYXZpZGEgZHVpIG1hdHRpcy4gQ3JhcyBwb3N1ZXJlLCBlcmF0IGluIHRpbmNpZHVudCBkaWduaXNzaW0sIG9yY2kgbnVuYyBsdWN0dXMgZGlhbSwgdmVsIHVsdHJpY2llcyBzYXBpZW4gZGlhbSBpZCBtZXR1cy4gTnVuYyBhdWN0b3IsIGxlY3R1cyBzZWQgcnV0cnVtIGhlbmRyZXJpdCwgdXJuYSBvcmNpIGNvbmd1ZSBsaWJlcm8sIGV1IHNjZWxlcmlzcXVlIHJpc3VzIGZlbGlzIGVnZXQgdXJuYS4gVml2YW11cyBtb2xsaXMgZmVsaXMgZW5pbSwgdGluY2lkdW50IGN1cnN1cyBxdWFtIGdyYXZpZGEgZnJpbmdpbGxhLiBQaGFzZWxsdXMgbWFsZXN1YWRhIGEgZXN0IGVnZXQgZXVpc21vZC4gUHJhZXNlbnQgdmVuZW5hdGlzIGxlbyB2aXRhZSBhdWd1ZSBwb3J0dGl0b3Igc2NlbGVyaXNxdWUuIERvbmVjIGltcGVyZGlldCwgb2Rpby5cXFwiXFxuICAgIH1cXG4gIF1cXG59XCI7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdHMuZGF0YS5kYXRlID09ICdNYXJjaCAyMDE1Jykge1xuICAgICAganNvblN0cmluZyA9IFwie1xcbiAgXFxcImRhdGVcXFwiOiBcXFwiTWFyY2ggMjAxNVxcXCIsXFxuICBcXFwicG9zdHNcXFwiOiBbXFxuICAgIHtcXG4gICAgICBcXFwiaWRcXFwiOiAzLFxcbiAgICAgIFxcXCJ0aXRsZVxcXCI6IFxcXCJUaGUgZ3JlYXQgcG9zdFxcXCIsXFxuICAgICAgXFxcInRpbWVzdGFtcFxcXCI6IFxcXCJNYXJjaCAxLCAyMDE1LCAzOjAwOjAwIFBNXFxcIixcXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuIE1vcmJpIGNvbmRpbWVudHVtIGNvbmd1ZSB2ZWhpY3VsYS4gRnVzY2UgdGluY2lkdW50IGVuaW0gdGVsbHVzLCBlZ2V0IHBvcnRhIGF1Z3VlIHRlbXBvciB1bHRyaWNlcy4gUGVsbGVudGVzcXVlIHN1c2NpcGl0IG9yY2kgaWQgbWF1cmlzIHBvc3VlcmUsIG5lYyBpYWN1bGlzIHR1cnBpcyBpYWN1bGlzLiBQcmFlc2VudCBtYXR0aXMgZW5pbSBpZCBkdWkgbWF4aW11cywgZXUgY29uc2VxdWF0IGR1aSB0cmlzdGlxdWUuIE51bGxhbSBtYXhpbXVzIG5pYmggYXQgZXggbWF0dGlzLCBuZWMgdmVzdGlidWx1bSBlcm9zIG1heGltdXMuIFBlbGxlbnRlc3F1ZSBxdWlzIGZldWdpYXQgZXJvcy4gTnVsbGFtIHZpdGFlIGZyaW5naWxsYSBsZWN0dXMsIGF0IGZhdWNpYnVzIG1pLiBTdXNwZW5kaXNzZSB2ZWwgdml2ZXJyYSBuaWJoLiBWZXN0aWJ1bHVtIGNvbmd1ZSB1cm5hIGVnZXQgdmVsaXQgbGFvcmVldCwgbm9uIGRpZ25pc3NpbSBwdXJ1cyBmYXVjaWJ1cy4gSW50ZWdlciBub24gc2FnaXR0aXMgbnVsbGEuIER1aXMgdXQgdHJpc3RpcXVlIG1pLCBzZWQgc2NlbGVyaXNxdWUgZXN0LiBWaXZhbXVzIHNhcGllbiBzZW0sIGZhdWNpYnVzIGV0IGZhdWNpYnVzIGFjLCBmYWNpbGlzaXMgYSBsZW8uIE51bmMgaW4gc2VtIGxpYmVyby4gXFxcXG5TZWQgbW9sbGlzIHVybmEgYWMgZWdlc3RhcyB2aXZlcnJhLiBVdCBpbiBkb2xvciBldCBqdXN0byBpYWN1bGlzIGRpZ25pc3NpbS4gTnVsbGEgcGVsbGVudGVzcXVlIGxvcmVtIGV0IHRlbGx1cyBsYWNpbmlhLCBzZWQgZ3JhdmlkYSBkdWkgbWF0dGlzLiBDcmFzIHBvc3VlcmUsIGVyYXQgaW4gdGluY2lkdW50IGRpZ25pc3NpbSwgb3JjaSBudW5jIGx1Y3R1cyBkaWFtLCB2ZWwgdWx0cmljaWVzIHNhcGllbiBkaWFtIGlkIG1ldHVzLiBOdW5jIGF1Y3RvciwgbGVjdHVzIHNlZCBydXRydW0gaGVuZHJlcml0LCB1cm5hIG9yY2kgY29uZ3VlIGxpYmVybywgZXUgc2NlbGVyaXNxdWUgcmlzdXMgZmVsaXMgZWdldCB1cm5hLiBWaXZhbXVzIG1vbGxpcyBmZWxpcyBlbmltLCB0aW5jaWR1bnQgY3Vyc3VzIHF1YW0gZ3JhdmlkYSBmcmluZ2lsbGEuIFBoYXNlbGx1cyBtYWxlc3VhZGEgYSBlc3QgZWdldCBldWlzbW9kLiBQcmFlc2VudCB2ZW5lbmF0aXMgbGVvIHZpdGFlIGF1Z3VlIHBvcnR0aXRvciBzY2VsZXJpc3F1ZS4gRG9uZWMgaW1wZXJkaWV0LCBvZGlvLlxcXCJcXG4gICAgfVxcbiAgXVxcbn1cIjtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0cy5kYXRhLmRhdGUgPT0gJ0ZlYnJ1YXJ5IDIwMTUnKSB7XG4gICAgICBqc29uU3RyaW5nID0gXCJ7XFxuICBcXFwiZGF0ZVxcXCI6IFxcXCJGZWJydWFyeSAyMDE1XFxcIixcXG4gIFxcXCJwb3N0c1xcXCI6IFtcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDIsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBncmVhdCBwb3N0XFxcIixcXG4gICAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkZlYnJ1YXJ5IDEsIDIwMTUsIDM6MDA6MDAgUE1cXFwiLFxcbiAgICAgIFxcXCJ0ZXh0XFxcIjogXFxcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIE51bGxhbSBzZW1wZXIgbWF1cmlzIGFjIGp1c3RvIHRlbXBvciBjb25zZWN0ZXR1ci4gTW9yYmkgcmhvbmN1cyBpYWN1bGlzIGlwc3VtIGlkIGNvbmRpbWVudHVtLiBEb25lYyBmYXVjaWJ1cyBsZW8gc2NlbGVyaXNxdWUgc2NlbGVyaXNxdWUgYWxpcXVldC4gTW9yYmkgY29uZGltZW50dW0gY29uZ3VlIHZlaGljdWxhLiBGdXNjZSB0aW5jaWR1bnQgZW5pbSB0ZWxsdXMsIGVnZXQgcG9ydGEgYXVndWUgdGVtcG9yIHVsdHJpY2VzLiBQZWxsZW50ZXNxdWUgc3VzY2lwaXQgb3JjaSBpZCBtYXVyaXMgcG9zdWVyZSwgbmVjIGlhY3VsaXMgdHVycGlzIGlhY3VsaXMuIFByYWVzZW50IG1hdHRpcyBlbmltIGlkIGR1aSBtYXhpbXVzLCBldSBjb25zZXF1YXQgZHVpIHRyaXN0aXF1ZS4gTnVsbGFtIG1heGltdXMgbmliaCBhdCBleCBtYXR0aXMsIG5lYyB2ZXN0aWJ1bHVtIGVyb3MgbWF4aW11cy4gUGVsbGVudGVzcXVlIHF1aXMgZmV1Z2lhdCBlcm9zLiBOdWxsYW0gdml0YWUgZnJpbmdpbGxhIGxlY3R1cywgYXQgZmF1Y2lidXMgbWkuIFN1c3BlbmRpc3NlIHZlbCB2aXZlcnJhIG5pYmguIFZlc3RpYnVsdW0gY29uZ3VlIHVybmEgZWdldCB2ZWxpdCBsYW9yZWV0LCBub24gZGlnbmlzc2ltIHB1cnVzIGZhdWNpYnVzLiBJbnRlZ2VyIG5vbiBzYWdpdHRpcyBudWxsYS4gRHVpcyB1dCB0cmlzdGlxdWUgbWksIHNlZCBzY2VsZXJpc3F1ZSBlc3QuIFZpdmFtdXMgc2FwaWVuIHNlbSwgZmF1Y2lidXMgZXQgZmF1Y2lidXMgYWMsIGZhY2lsaXNpcyBhIGxlby4gTnVuYyBpbiBzZW0gbGliZXJvLiBcXFxcblNlZCBtb2xsaXMgdXJuYSBhYyBlZ2VzdGFzIHZpdmVycmEuIFV0IGluIGRvbG9yIGV0IGp1c3RvIGlhY3VsaXMgZGlnbmlzc2ltLiBOdWxsYSBwZWxsZW50ZXNxdWUgbG9yZW0gZXQgdGVsbHVzIGxhY2luaWEsIHNlZCBncmF2aWRhIGR1aSBtYXR0aXMuIENyYXMgcG9zdWVyZSwgZXJhdCBpbiB0aW5jaWR1bnQgZGlnbmlzc2ltLCBvcmNpIG51bmMgbHVjdHVzIGRpYW0sIHZlbCB1bHRyaWNpZXMgc2FwaWVuIGRpYW0gaWQgbWV0dXMuIE51bmMgYXVjdG9yLCBsZWN0dXMgc2VkIHJ1dHJ1bSBoZW5kcmVyaXQsIHVybmEgb3JjaSBjb25ndWUgbGliZXJvLCBldSBzY2VsZXJpc3F1ZSByaXN1cyBmZWxpcyBlZ2V0IHVybmEuIFZpdmFtdXMgbW9sbGlzIGZlbGlzIGVuaW0sIHRpbmNpZHVudCBjdXJzdXMgcXVhbSBncmF2aWRhIGZyaW5naWxsYS4gUGhhc2VsbHVzIG1hbGVzdWFkYSBhIGVzdCBlZ2V0IGV1aXNtb2QuIFByYWVzZW50IHZlbmVuYXRpcyBsZW8gdml0YWUgYXVndWUgcG9ydHRpdG9yIHNjZWxlcmlzcXVlLiBEb25lYyBpbXBlcmRpZXQsIG9kaW8uXFxcIlxcbiAgICB9XFxuICBdXFxufVwiO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRzLmRhdGEuZGF0ZSA9PSAnSmFudWFyeSAyMDE1Jykge1xuICAgICAganNvblN0cmluZyA9IFwie1xcbiAgXFxcImRhdGVcXFwiOiBcXFwiSmFudWFyeSAyMDE1XFxcIixcXG4gIFxcXCJwb3N0c1xcXCI6IFtcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDEsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBncmVhdCBwb3N0XFxcIixcXG4gICAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkphbnVhcnkgMSwgMjAxNSwgMzowMDowMCBQTVxcXCIsXFxuICAgICAgXFxcInRleHRcXFwiOiBcXFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdC4gTnVsbGFtIHNlbXBlciBtYXVyaXMgYWMganVzdG8gdGVtcG9yIGNvbnNlY3RldHVyLiBNb3JiaSByaG9uY3VzIGlhY3VsaXMgaXBzdW0gaWQgY29uZGltZW50dW0uIERvbmVjIGZhdWNpYnVzIGxlbyBzY2VsZXJpc3F1ZSBzY2VsZXJpc3F1ZSBhbGlxdWV0LiBNb3JiaSBjb25kaW1lbnR1bSBjb25ndWUgdmVoaWN1bGEuIEZ1c2NlIHRpbmNpZHVudCBlbmltIHRlbGx1cywgZWdldCBwb3J0YSBhdWd1ZSB0ZW1wb3IgdWx0cmljZXMuIFBlbGxlbnRlc3F1ZSBzdXNjaXBpdCBvcmNpIGlkIG1hdXJpcyBwb3N1ZXJlLCBuZWMgaWFjdWxpcyB0dXJwaXMgaWFjdWxpcy4gUHJhZXNlbnQgbWF0dGlzIGVuaW0gaWQgZHVpIG1heGltdXMsIGV1IGNvbnNlcXVhdCBkdWkgdHJpc3RpcXVlLiBOdWxsYW0gbWF4aW11cyBuaWJoIGF0IGV4IG1hdHRpcywgbmVjIHZlc3RpYnVsdW0gZXJvcyBtYXhpbXVzLiBQZWxsZW50ZXNxdWUgcXVpcyBmZXVnaWF0IGVyb3MuIE51bGxhbSB2aXRhZSBmcmluZ2lsbGEgbGVjdHVzLCBhdCBmYXVjaWJ1cyBtaS4gU3VzcGVuZGlzc2UgdmVsIHZpdmVycmEgbmliaC4gVmVzdGlidWx1bSBjb25ndWUgdXJuYSBlZ2V0IHZlbGl0IGxhb3JlZXQsIG5vbiBkaWduaXNzaW0gcHVydXMgZmF1Y2lidXMuIEludGVnZXIgbm9uIHNhZ2l0dGlzIG51bGxhLiBEdWlzIHV0IHRyaXN0aXF1ZSBtaSwgc2VkIHNjZWxlcmlzcXVlIGVzdC4gVml2YW11cyBzYXBpZW4gc2VtLCBmYXVjaWJ1cyBldCBmYXVjaWJ1cyBhYywgZmFjaWxpc2lzIGEgbGVvLiBOdW5jIGluIHNlbSBsaWJlcm8uIFxcXFxuU2VkIG1vbGxpcyB1cm5hIGFjIGVnZXN0YXMgdml2ZXJyYS4gVXQgaW4gZG9sb3IgZXQganVzdG8gaWFjdWxpcyBkaWduaXNzaW0uIE51bGxhIHBlbGxlbnRlc3F1ZSBsb3JlbSBldCB0ZWxsdXMgbGFjaW5pYSwgc2VkIGdyYXZpZGEgZHVpIG1hdHRpcy4gQ3JhcyBwb3N1ZXJlLCBlcmF0IGluIHRpbmNpZHVudCBkaWduaXNzaW0sIG9yY2kgbnVuYyBsdWN0dXMgZGlhbSwgdmVsIHVsdHJpY2llcyBzYXBpZW4gZGlhbSBpZCBtZXR1cy4gTnVuYyBhdWN0b3IsIGxlY3R1cyBzZWQgcnV0cnVtIGhlbmRyZXJpdCwgdXJuYSBvcmNpIGNvbmd1ZSBsaWJlcm8sIGV1IHNjZWxlcmlzcXVlIHJpc3VzIGZlbGlzIGVnZXQgdXJuYS4gVml2YW11cyBtb2xsaXMgZmVsaXMgZW5pbSwgdGluY2lkdW50IGN1cnN1cyBxdWFtIGdyYXZpZGEgZnJpbmdpbGxhLiBQaGFzZWxsdXMgbWFsZXN1YWRhIGEgZXN0IGVnZXQgZXVpc21vZC4gUHJhZXNlbnQgdmVuZW5hdGlzIGxlbyB2aXRhZSBhdWd1ZSBwb3J0dGl0b3Igc2NlbGVyaXNxdWUuIERvbmVjIGltcGVyZGlldCwgb2Rpby5cXFwiXFxuICAgIH1cXG4gIF1cXG59XCI7XG4gICAgfVxuICB9IGVsc2UgaWYgKHRoaXMub3B0cy5kYXRhLm1ldGhvZCA9PSAnZmV0Y2hDb21tZW50cycpIHtcbiAgICBqc29uU3RyaW5nID0gXCJbXFxuICB7XFxuICAgIFxcXCJuYW1lXFxcIjogXFxcIlRoaXMgZ3V5XFxcIixcXG4gICAgXFxcInRpbWVzdGFtcFxcXCI6IFxcXCJKdW5lIDIsIDIwMTUsIDQ6MDA6MDAgUE1cXFwiLFxcbiAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuXFxcIlxcbiAgfSxcXG4gIHtcXG4gICAgXFxcIm5hbWVcXFwiOiBcXFwiVGhhdCBndXlcXFwiLFxcbiAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkp1bmUgMiwgMjAxNSwgNDowMDowMCBQTVxcXCIsXFxuICAgIFxcXCJ0ZXh0XFxcIjogXFxcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIE51bGxhbSBzZW1wZXIgbWF1cmlzIGFjIGp1c3RvIHRlbXBvciBjb25zZWN0ZXR1ci4gTW9yYmkgcmhvbmN1cyBpYWN1bGlzIGlwc3VtIGlkIGNvbmRpbWVudHVtLiBEb25lYyBmYXVjaWJ1cyBsZW8gc2NlbGVyaXNxdWUgc2NlbGVyaXNxdWUgYWxpcXVldC5cXFwiXFxuICB9XFxuICAsXFxuICB7XFxuICAgIFxcXCJuYW1lXFxcIjogXFxcIkZpbmFsIGd1eVxcXCIsXFxuICAgIFxcXCJ0aW1lc3RhbXBcXFwiOiBcXFwiSnVuZSAyLCAyMDE1LCA0OjAwOjAwIFBNXFxcIixcXG4gICAgXFxcInRleHRcXFwiOiBcXFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdC4gTnVsbGFtIHNlbXBlciBtYXVyaXMgYWMganVzdG8gdGVtcG9yIGNvbnNlY3RldHVyLiBNb3JiaSByaG9uY3VzIGlhY3VsaXMgaXBzdW0gaWQgY29uZGltZW50dW0uIERvbmVjIGZhdWNpYnVzIGxlbyBzY2VsZXJpc3F1ZSBzY2VsZXJpc3F1ZSBhbGlxdWV0LlxcXCJcXG4gIH1cXG5dXCI7XG4gIH0gZWxzZSBpZiAodGhpcy5vcHRzLmRhdGEubWV0aG9kID09ICdwb3N0Q29tbWVudCcpIHtcbiAgICBqc29uU3RyaW5nID0gXCJ7XFxuICBcXFwic3VjY2Vzc1xcXCI6IHRydWVcXG59XCI7XG4gIH1cblxuICB0aGlzLnJlc3BvbnNlID0gSlNPTi5wYXJzZShqc29uU3RyaW5nKTtcblxuICAvLyBzZXQgdGltZXIgdG8gcnVuIHRoaXMuZG9uZVByb21pc2UgYWZ0ZXIgc29tZSB0aW1lb3V0LCBzaW11bGF0ZSBhIG5ldHdvcmsgZGVsYXlcbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBpZiAoc2VsZi5kb25lUHJvbWlzZSkge1xuICAgICAgc2VsZi5kb25lUHJvbWlzZShzZWxmLnJlc3BvbnNlKTtcbiAgICB9XG4gIH0sIDIwMCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbk1vY2tBamF4LnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24oZikge1xuICB0aGlzLmRvbmVQcm9taXNlID0gZjtcbn07XG5cbk1vY2tBamF4LnByb3RvdHlwZS5mYWlsID0gZnVuY3Rpb24oZikge1xuICB0aGlzLmZhaWxQcm9taXNlID0gZjtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBuZXcgT3ZlcmxheSgpO1xuXG5mdW5jdGlvbiBPdmVybGF5KCkge1xuICB0aGlzLnRpbWVyID0gbnVsbDtcbiAgdGhpcy5pbWFnZSA9IG51bGw7XG4gIHRoaXMuaGVpZ2h0ID0gMDtcbiAgdGhpcy53aWR0aCA9IDA7XG4gIHRoaXMuJGltZyA9IG51bGw7XG4gIHRoaXMuZnJhbWVzID0gMDtcbiAgdGhpcy5pbnRlcnZhbCA9IDA7XG4gIHRoaXMueCA9IDA7XG4gIHRoaXMuaW5kZXggPSAwO1xufVxuXG5PdmVybGF5LnByb3RvdHlwZS5zZXRDb25maWcgPSBmdW5jdGlvbihhcmdzKSB7XG4gIHRoaXMudGltZXIgPSBudWxsO1xuICB0aGlzLmhlaWdodCA9IGFyZ3MuaGVpZ2h0O1xuICB0aGlzLndpZHRoID0gYXJncy53aWR0aDtcbiAgdGhpcy4kaW1nID0gYXJncy5pbWc7XG4gIHRoaXMuJG92ZXJsYXkgPSBhcmdzLm92ZXJsYXk7XG4gIHRoaXMuZnJhbWVzID0gYXJncy5mcmFtZXM7XG4gIHRoaXMuaW50ZXJ2YWwgPSBhcmdzLmludGVydmFsO1xuICB0aGlzLnggPSAwO1xuICB0aGlzLmluZGV4ID0gMDtcbiAgdGhpcy5pbWFnZSA9IG5ldyBJbWFnZSgpO1xuICB0aGlzLmltYWdlLnNyYyA9IGFyZ3Muc3JjO1xuICB0aGlzLiRpbWcuY3NzKCdiYWNrZ3JvdW5kSW1hZ2UnLCAndXJsKCcgKyB0aGlzLmltYWdlLnNyYyArICcpJyk7XG4gIHRoaXMuJGltZy53aWR0aCh0aGlzLndpZHRoICsgJ3B4Jyk7XG4gIHRoaXMuJGltZy5oZWlnaHQodGhpcy5oZWlnaHQgKyAncHgnKTtcbn07XG5cbk92ZXJsYXkucHJvdG90eXBlLmRpc3BsYXkgPSBmdW5jdGlvbigpIHtcbiAgLy8gc2hvdyB0aGUgb3ZlcmxheVxuICBpZiAodGhpcy50aW1lciA9PT0gbnVsbCkge1xuICAgIHRoaXMuYW5pbWF0ZSgpO1xuICAgIHRoaXMuJG92ZXJsYXkuc2hvdygpO1xuICB9XG59O1xuXG5PdmVybGF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgLy8gaGlkZSB0aGUgb3ZlcmxheVxuICB0aGlzLiRvdmVybGF5LmhpZGUoKTtcbiAgY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpO1xuICB0aGlzLnRpbWVyID0gbnVsbDtcbiAgdGhpcy54ID0gMDtcbiAgdGhpcy5pbmRleCA9IDA7XG59O1xuXG5PdmVybGF5LnByb3RvdHlwZS5hbmltYXRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuJGltZy5jc3MoJ2JhY2tncm91bmRQb3NpdGlvbicsIHRoaXMueCArICdweCAwJyk7XG4gIHRoaXMueCAtPSB0aGlzLndpZHRoO1xuICB0aGlzLmluZGV4Kys7XG5cbiAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5mcmFtZXMpIHtcbiAgICB0aGlzLnggPSAwO1xuICAgIHRoaXMuaW5kZXggPSAwO1xuICB9XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHRoaXMudGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuYW5pbWF0ZSgpO1xuICB9LCB0aGlzLmludGVydmFsKTtcbn07IiwiXG52YXIgbWVkaWF0b3IgPSByZXF1aXJlKCcuLi9tZWRpYXRvci9tZWRpYXRvcicpO1xudmFyIE1vY2tBamF4ID0gcmVxdWlyZSgnLi4vbW9ja19hamF4L21vY2tfYWpheCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpZGViYXI7XG5cbmZ1bmN0aW9uIFNpZGViYXIob3B0cykge1xuICB2YXIgaHRtbCA9IFwiPGRpdiBjbGFzcz1cXFwic2lkZWJhclxcXCI+XFxuICAgPHVsPjwvdWw+XFxuICAgPGhyPlxcbjwvZGl2PlxcblwiO1xuICB0aGlzLiRlbCA9ICQoaHRtbCk7XG4gIHRoaXMuZWxlbWVudHNUZW1wbGF0ZSA9IF8udGVtcGxhdGUoXCI8JSBfLmVhY2goZWxlbWVudHMsIGZ1bmN0aW9uKGVsLCBpKSB7ICU+XFxuICA8bGk8JT0gaSA9PSAwID8gJyBjbGFzcz1cXFwiYWN0aXZlXFxcIicgOiAnJyAlPj5cXG4gICAgPGEgaHJlZj1cXFwiamF2YXNjcmlwdDogdm9pZCgwKTtcXFwiPjwlPSBlbCAlPjwvYT5cXG4gIDwvbGk+XFxuPCUgfSk7ICU+XFxuXCIpO1xuICB0aGlzLnVybCA9IG9wdHMudXJsO1xuXG4gIHZhciBzZWxmID0gdGhpcztcblxuICBtZWRpYXRvci5zdWJzY3JpYmUoJ3BhZ2UtaW5pdCcsIGZ1bmN0aW9uKCkgeyAgXG4gICAgc2VsZi5mZXRjaE9wdGlvbnMoKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cblNpZGViYXIucHJvdG90eXBlLmFwcGVuZFRvID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICQodGFyZ2V0KS5hcHBlbmQodGhpcy4kZWwpO1xufTtcblxuU2lkZWJhci5wcm90b3R5cGUuZmV0Y2hPcHRpb25zID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvLyB1c2UgYSBjdXN0b20gbW9jayBhamF4IG9iamVjdCwgbG9va3MgbGlrZSAkLmFqYXggc28gZWFzeSB0byBwbHVnaW4gdG8gcmVhbCBsaWJyYXJ5IGxhdGVyXG4gIHZhciByZXF1ZXN0ID0gbmV3IE1vY2tBamF4KHtcbiAgICB0eXBlOiAnZ2V0JyxcbiAgICB1cmw6IHRoaXMudXJsLFxuICAgIGRhdGE6IHsgbWV0aG9kOiAnZmV0Y2hPcHRpb25zJyB9LFxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgfSk7XG5cbiAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgc2VsZi5pbnNlcnRPcHRpb25zKHJlc3BvbnNlKTtcbiAgICBtZWRpYXRvci5wdWJsaXNoKCdvcHRpb24tc2VsZWN0ZWQnLCB7IGRhdGU6IHJlc3BvbnNlWzBdIH0pO1xuICB9KTtcblxuICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3InKTtcbiAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gIH0pO1xufTtcblxuU2lkZWJhci5wcm90b3R5cGUuaW5zZXJ0T3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyICR1bCA9IHRoaXMuJGVsLmZpbmQoJ3VsJyk7XG4gICR1bC5hcHBlbmQodGhpcy5lbGVtZW50c1RlbXBsYXRlKHsgZWxlbWVudHM6IG9wdGlvbnMgfSkpO1xuXG4gIHZhciBzZWxmID0gdGhpcztcblxuICAkdWwuZmluZCgnYScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgIHZhciAkYSA9ICQodGhpcyk7XG4gICAgdmFyICRwYXJlbnQgPSAkYS5wYXJlbnQoKTtcblxuICAgIGlmICgkcGFyZW50Lmhhc0NsYXNzKCdhY3RpdmUnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYuJGVsLmZpbmQoJ2xpLmFjdGl2ZScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAkcGFyZW50LmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICBtZWRpYXRvci5wdWJsaXNoKCdvcHRpb24tc2VsZWN0ZWQnLCB7IGRhdGU6ICRhLnRleHQoKSB9KTtcbiAgfSk7XG59OyJdfQ==
