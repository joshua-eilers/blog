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
var MockAjax = require('../mock_ajax/mock_ajax');
var Comments = require('../comments/comments');

module.exports = Blog;

function Blog(opts) {
  var html = "<div class=\"blog\">\n  <h1 class=\"page-header\">Blog <small></small></h1>\n  <div class=\"posts\"></div>\n</div>";
  this.$el = $(html);
  this.url = opts.url;
  this.postsTemplate = _.template("<% _.each(posts, function(post) { %>\n  <div class=\"post\">\n    <h2 class=\"post-title\"><%= post.title %></h2>\n    <div class=\"post-time\"><span class=\"glyphicon glyphicon-time\"></span> <%= post.timestamp %></div>\n    <br>\n    <div class=\"post-text trunc\"><%= post.text %></div>\n    <input class=\"post-id\" type=\"hidden\" value=\"<%= post.id %>\">\n    <div class=\"post-comments\">\n      <hr>\n    </div>\n    <button class=\"btn btn-primary btn-read-more\">Read more</button>\n  </div>\n<% }); %>");

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
    var $comments = $this.siblings('.post-comments');
    
    $this.siblings('.post-text').removeClass('trunc');

    new Comments({
      url: null,
      $target: $comments,
      id: $this.siblings('.post-id').val()
    });
    
    $comments.show();

    $this.remove();
  });
};
},{"../comments/comments":3,"../mediator/mediator":4,"../mock_ajax/mock_ajax":5}],3:[function(require,module,exports){

var overlay = require('../overlay/overlay');
var MockAjax = require('../mock_ajax/mock_ajax');

module.exports = Comments;

function Comments(opts) {
  this.url = opts.url;
  this.$target = opts.$target;
  this.postId = opts.id;
  this.commentsTemplate = _.template("<div class=\"comments\">\n  <div class=\"well\">\n    <h4>Add a comment:</h4>\n    <form class=\"form\">\n      <div class=\"form-group\">\n        <input class=\"form-control add-comment-name\" placeholder=\"Name\">\n      </div>\n      <div class=\"form-group \">\n        <textarea class=\"form-control add-comment-text\" placeholder=\"Comment here...\" rows=\"3\"></textarea>\n      </div>\n      <button type=\"submit\" class=\"btn btn-primary btn-sm\">Submit</button>\n    </form>\n  </div>\n  <hr>\n  <div class=\"comments-list\">\n    <% _.each(comments, function(comment) { %>\n      <div class=\"comment\">\n        <img class=\"pull-left\" src=\"lib/images/placeholder.png\">\n        <h4><%= comment.name %> <small class=\"pull-right\"><%= comment.timestamp %></small></h4>\n        <%= comment.text %>\n      </div>\n    <% }); %>\n  </div>\n</div>");

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
      jsonString = "{\n  \"date\": \"June 2015\",\n  \"posts\": [\n    {\n      \"id\": 6,\n      \"title\": \"The great post\",\n      \"timestamp\": \"June 1, 2015 at 3:00 PM\",\n      \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet. Morbi condimentum congue vehicula. Fusce tincidunt enim tellus, eget porta augue tempor ultrices. Pellentesque suscipit orci id mauris posuere, nec iaculis turpis iaculis. Praesent mattis enim id dui maximus, eu consequat dui tristique. Nullam maximus nibh at ex mattis, nec vestibulum eros maximus. Pellentesque quis feugiat eros. Nullam vitae fringilla lectus, at faucibus mi. Suspendisse vel viverra nibh. Vestibulum congue urna eget velit laoreet, non dignissim purus faucibus. Integer non sagittis nulla. Duis ut tristique mi, sed scelerisque est. Vivamus sapien sem, faucibus et faucibus ac, facilisis a leo. Nunc in sem libero. \\nSed mollis urna ac egestas viverra. Ut in dolor et justo iaculis dignissim. Nulla pellentesque lorem et tellus lacinia, sed gravida dui mattis. Cras posuere, erat in tincidunt dignissim, orci nunc luctus diam, vel ultricies sapien diam id metus. Nunc auctor, lectus sed rutrum hendrerit, urna orci congue libero, eu scelerisque risus felis eget urna. Vivamus mollis felis enim, tincidunt cursus quam gravida fringilla. Phasellus malesuada a est eget euismod. Praesent venenatis leo vitae augue porttitor scelerisque. Donec imperdiet, odio.\"\n    }\n  ]\n}";
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
    jsonString = "[\n  {\n    \"name\": \"This guy\",\n    \"timestamp\": \"June 2 2015 at 4:00 PM\",\n    \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet.\"\n  },\n  {\n    \"name\": \"That guy\",\n    \"timestamp\": \"June 2 2015 at 4:00 PM\",\n    \"text\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam semper mauris ac justo tempor consectetur. Morbi rhoncus iaculis ipsum id condimentum. Donec faucibus leo scelerisque scelerisque aliquet.\"\n  }\n]";
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc3JjL21haW4uanMiLCJhcHAvc3JjL21vZHVsZXMvYmxvZy9ibG9nLmpzIiwiYXBwL3NyYy9tb2R1bGVzL2NvbW1lbnRzL2NvbW1lbnRzLmpzIiwiYXBwL3NyYy9tb2R1bGVzL21lZGlhdG9yL21lZGlhdG9yLmpzIiwiYXBwL3NyYy9tb2R1bGVzL21vY2tfYWpheC9tb2NrX2FqYXguanMiLCJhcHAvc3JjL21vZHVsZXMvb3ZlcmxheS9vdmVybGF5LmpzIiwiYXBwL3NyYy9tb2R1bGVzL3NpZGViYXIvc2lkZWJhci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxudmFyIG1lZGlhdG9yID0gcmVxdWlyZSgnLi9tb2R1bGVzL21lZGlhdG9yL21lZGlhdG9yJyk7XG52YXIgb3ZlcmxheSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9vdmVybGF5L292ZXJsYXknKTtcbnZhciBTaWRlYmFyID0gcmVxdWlyZSgnLi9tb2R1bGVzL3NpZGViYXIvc2lkZWJhcicpO1xudmFyIEJsb2cgPSByZXF1aXJlKCcuL21vZHVsZXMvYmxvZy9ibG9nJyk7XG5cbnZhciBhcHBsaWNhdGlvblN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIC8vIHNldHVwIGluaXRpYWwgcGFnZSBza2VsZXRvblxuICB2YXIgaHRtbCA9IFwiPGRpdiBpZD1cXFwib3ZlcmxheVxcXCI+XFxuICA8ZGl2IGlkPVxcXCJsb2FkZXJJbWFnZVxcXCI+PC9kaXY+XFxuPC9kaXY+XFxuPGRpdiBjbGFzcz1cXFwiY29udGFpbmVyLWZsdWlkXFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcInJvd1xcXCI+XFxuICAgIDxkaXYgaWQ9XFxcInNpZGViYXItY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiY29sLXhzLTMgY29sLW1kLTMgY29sLWxnLTJcXFwiPjwvZGl2PlxcbiAgICA8ZGl2IGlkPVxcXCJibG9nLWNvbnRhaW5lclxcXCIgY2xhc3M9XFxcImNvbC14cy1vZmZzZXQtMyBjb2wteHMtOSBjb2wtbWQtb2Zmc2V0LTMgY29sLW1kLTggY29sLWxnLW9mZnNldC0yIGNvbC1sZy0xMFxcXCI+PC9kaXY+XFxuICA8L2Rpdj5cXG48L2Rpdj5cIjtcbiAgJCgnI21haW4tcGFnZS1jb250ZW50JykuaHRtbChodG1sKTtcblxuICAvLyBpbnN0YW50aWF0ZSBtb2R1bGVzXG4gIHZhciBzaWRlYmFyID0gbmV3IFNpZGViYXIoeyB1cmw6IG51bGwgfSk7XG4gIHZhciBibG9nID0gbmV3IEJsb2coeyB1cmw6IG51bGwgfSk7XG5cbiAgb3ZlcmxheS5zZXRDb25maWcoe1xuICAgIHNyYzogJ2xpYi9pbWFnZXMvbG9hZGluZy5wbmcnLFxuICAgIHdpZHRoOiAxNTAsXG4gICAgaGVpZ2h0OiAxNTAsXG4gICAgaW1nOiAkKFwiI2xvYWRlckltYWdlXCIpLFxuICAgIG92ZXJsYXk6ICQoXCIjb3ZlcmxheVwiKSxcbiAgICBmcmFtZXM6IDEyLFxuICAgIGludGVydmFsOiA5MFxuICB9KTtcblxuICAvLyBkaXNwbGF5IHRoZSBtb2R1bGVzXG4gIHNpZGViYXIuYXBwZW5kVG8oJyNzaWRlYmFyLWNvbnRhaW5lcicpO1xuICBibG9nLmFwcGVuZFRvKCcjYmxvZy1jb250YWluZXInKTtcblxuICBtZWRpYXRvci5wdWJsaXNoKCdwYWdlLWluaXQnLCB7fSk7XG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeShhcHBsaWNhdGlvblN0YXJ0KTsiLCJcbnZhciBtZWRpYXRvciA9IHJlcXVpcmUoJy4uL21lZGlhdG9yL21lZGlhdG9yJyk7XG52YXIgTW9ja0FqYXggPSByZXF1aXJlKCcuLi9tb2NrX2FqYXgvbW9ja19hamF4Jyk7XG52YXIgQ29tbWVudHMgPSByZXF1aXJlKCcuLi9jb21tZW50cy9jb21tZW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2c7XG5cbmZ1bmN0aW9uIEJsb2cob3B0cykge1xuICB2YXIgaHRtbCA9IFwiPGRpdiBjbGFzcz1cXFwiYmxvZ1xcXCI+XFxuICA8aDEgY2xhc3M9XFxcInBhZ2UtaGVhZGVyXFxcIj5CbG9nIDxzbWFsbD48L3NtYWxsPjwvaDE+XFxuICA8ZGl2IGNsYXNzPVxcXCJwb3N0c1xcXCI+PC9kaXY+XFxuPC9kaXY+XCI7XG4gIHRoaXMuJGVsID0gJChodG1sKTtcbiAgdGhpcy51cmwgPSBvcHRzLnVybDtcbiAgdGhpcy5wb3N0c1RlbXBsYXRlID0gXy50ZW1wbGF0ZShcIjwlIF8uZWFjaChwb3N0cywgZnVuY3Rpb24ocG9zdCkgeyAlPlxcbiAgPGRpdiBjbGFzcz1cXFwicG9zdFxcXCI+XFxuICAgIDxoMiBjbGFzcz1cXFwicG9zdC10aXRsZVxcXCI+PCU9IHBvc3QudGl0bGUgJT48L2gyPlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJwb3N0LXRpbWVcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLXRpbWVcXFwiPjwvc3Bhbj4gPCU9IHBvc3QudGltZXN0YW1wICU+PC9kaXY+XFxuICAgIDxicj5cXG4gICAgPGRpdiBjbGFzcz1cXFwicG9zdC10ZXh0IHRydW5jXFxcIj48JT0gcG9zdC50ZXh0ICU+PC9kaXY+XFxuICAgIDxpbnB1dCBjbGFzcz1cXFwicG9zdC1pZFxcXCIgdHlwZT1cXFwiaGlkZGVuXFxcIiB2YWx1ZT1cXFwiPCU9IHBvc3QuaWQgJT5cXFwiPlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJwb3N0LWNvbW1lbnRzXFxcIj5cXG4gICAgICA8aHI+XFxuICAgIDwvZGl2PlxcbiAgICA8YnV0dG9uIGNsYXNzPVxcXCJidG4gYnRuLXByaW1hcnkgYnRuLXJlYWQtbW9yZVxcXCI+UmVhZCBtb3JlPC9idXR0b24+XFxuICA8L2Rpdj5cXG48JSB9KTsgJT5cIik7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIG1lZGlhdG9yLnN1YnNjcmliZSgnb3B0aW9uLXNlbGVjdGVkJywgZnVuY3Rpb24oYXJncykge1xuICAgIHNlbGYuZmV0Y2hCbG9nKGFyZ3MuZGF0ZSk7XG4gIH0pO1xufVxuXG5CbG9nLnByb3RvdHlwZS5hcHBlbmRUbyA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAkKHRhcmdldCkuYXBwZW5kKHRoaXMuJGVsKTtcbn07XG5cbkJsb2cucHJvdG90eXBlLmZldGNoQmxvZyA9IGZ1bmN0aW9uKGRhdGUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIC8vIHVzZSBhIGN1c3RvbSBtb2NrIGFqYXggb2JqZWN0LCBsb29rcyBsaWtlICQuYWpheCBzbyBlYXN5IHRvIHBsdWdpbiB0byByZWFsIGxpYnJhcnkgbGF0ZXJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgTW9ja0FqYXgoe1xuICAgIHR5cGU6ICdnZXQnLFxuICAgIHVybDogdGhpcy51cmwsXG4gICAgZGF0YTogeyBtZXRob2Q6ICdmZXRjaEJsb2cnLCBkYXRlOiBkYXRlIH0sXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICB9KTtcblxuICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBzZWxmLnNldERhdGUocmVzcG9uc2UuZGF0ZSk7XG4gICAgc2VsZi5pbnNlcnRQb3N0cyhyZXNwb25zZS5wb3N0cyk7XG4gIH0pO1xuXG4gIHJlcXVlc3QuZmFpbChmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvcicpO1xuICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgfSk7XG59O1xuXG5CbG9nLnByb3RvdHlwZS5zZXREYXRlID0gZnVuY3Rpb24oZGF0ZSkge1xuICB0aGlzLiRlbC5maW5kKCdoMSA+IHNtYWxsJykuaHRtbChkYXRlKTtcbn07XG5cbkJsb2cucHJvdG90eXBlLmluc2VydFBvc3RzID0gZnVuY3Rpb24ocG9zdHMpIHtcbiAgdmFyIGh0bWwgPSB0aGlzLnBvc3RzVGVtcGxhdGUoeyBwb3N0czogcG9zdHMgfSk7XG4gIHRoaXMuJGVsLmZpbmQoJy5wb3N0cycpLmh0bWwoaHRtbCk7XG5cbiAgdGhpcy4kZWwuZmluZCgnLmJ0bi1yZWFkLW1vcmUnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgIHZhciAkY29tbWVudHMgPSAkdGhpcy5zaWJsaW5ncygnLnBvc3QtY29tbWVudHMnKTtcbiAgICBcbiAgICAkdGhpcy5zaWJsaW5ncygnLnBvc3QtdGV4dCcpLnJlbW92ZUNsYXNzKCd0cnVuYycpO1xuXG4gICAgbmV3IENvbW1lbnRzKHtcbiAgICAgIHVybDogbnVsbCxcbiAgICAgICR0YXJnZXQ6ICRjb21tZW50cyxcbiAgICAgIGlkOiAkdGhpcy5zaWJsaW5ncygnLnBvc3QtaWQnKS52YWwoKVxuICAgIH0pO1xuICAgIFxuICAgICRjb21tZW50cy5zaG93KCk7XG5cbiAgICAkdGhpcy5yZW1vdmUoKTtcbiAgfSk7XG59OyIsIlxudmFyIG92ZXJsYXkgPSByZXF1aXJlKCcuLi9vdmVybGF5L292ZXJsYXknKTtcbnZhciBNb2NrQWpheCA9IHJlcXVpcmUoJy4uL21vY2tfYWpheC9tb2NrX2FqYXgnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21tZW50cztcblxuZnVuY3Rpb24gQ29tbWVudHMob3B0cykge1xuICB0aGlzLnVybCA9IG9wdHMudXJsO1xuICB0aGlzLiR0YXJnZXQgPSBvcHRzLiR0YXJnZXQ7XG4gIHRoaXMucG9zdElkID0gb3B0cy5pZDtcbiAgdGhpcy5jb21tZW50c1RlbXBsYXRlID0gXy50ZW1wbGF0ZShcIjxkaXYgY2xhc3M9XFxcImNvbW1lbnRzXFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcIndlbGxcXFwiPlxcbiAgICA8aDQ+QWRkIGEgY29tbWVudDo8L2g0PlxcbiAgICA8Zm9ybSBjbGFzcz1cXFwiZm9ybVxcXCI+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cFxcXCI+XFxuICAgICAgICA8aW5wdXQgY2xhc3M9XFxcImZvcm0tY29udHJvbCBhZGQtY29tbWVudC1uYW1lXFxcIiBwbGFjZWhvbGRlcj1cXFwiTmFtZVxcXCI+XFxuICAgICAgPC9kaXY+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cCBcXFwiPlxcbiAgICAgICAgPHRleHRhcmVhIGNsYXNzPVxcXCJmb3JtLWNvbnRyb2wgYWRkLWNvbW1lbnQtdGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIkNvbW1lbnQgaGVyZS4uLlxcXCIgcm93cz1cXFwiM1xcXCI+PC90ZXh0YXJlYT5cXG4gICAgICA8L2Rpdj5cXG4gICAgICA8YnV0dG9uIHR5cGU9XFxcInN1Ym1pdFxcXCIgY2xhc3M9XFxcImJ0biBidG4tcHJpbWFyeSBidG4tc21cXFwiPlN1Ym1pdDwvYnV0dG9uPlxcbiAgICA8L2Zvcm0+XFxuICA8L2Rpdj5cXG4gIDxocj5cXG4gIDxkaXYgY2xhc3M9XFxcImNvbW1lbnRzLWxpc3RcXFwiPlxcbiAgICA8JSBfLmVhY2goY29tbWVudHMsIGZ1bmN0aW9uKGNvbW1lbnQpIHsgJT5cXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJjb21tZW50XFxcIj5cXG4gICAgICAgIDxpbWcgY2xhc3M9XFxcInB1bGwtbGVmdFxcXCIgc3JjPVxcXCJsaWIvaW1hZ2VzL3BsYWNlaG9sZGVyLnBuZ1xcXCI+XFxuICAgICAgICA8aDQ+PCU9IGNvbW1lbnQubmFtZSAlPiA8c21hbGwgY2xhc3M9XFxcInB1bGwtcmlnaHRcXFwiPjwlPSBjb21tZW50LnRpbWVzdGFtcCAlPjwvc21hbGw+PC9oND5cXG4gICAgICAgIDwlPSBjb21tZW50LnRleHQgJT5cXG4gICAgICA8L2Rpdj5cXG4gICAgPCUgfSk7ICU+XFxuICA8L2Rpdj5cXG48L2Rpdj5cIik7XG5cbiAgdGhpcy5mZXRjaENvbW1lbnRzKHRoaXMucG9zdElkKTtcblxuICByZXR1cm4gdGhpcztcbn1cblxuQ29tbWVudHMucHJvdG90eXBlLmZldGNoQ29tbWVudHMgPSBmdW5jdGlvbihpZCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgLy8gdXNlIGEgY3VzdG9tIG1vY2sgYWpheCBvYmplY3QsIGxvb2tzIGxpa2UgJC5hamF4IHNvIGVhc3kgdG8gcGx1Z2luIHRvIHJlYWwgbGlicmFyeSBsYXRlclxuICB2YXIgcmVxdWVzdCA9IG5ldyBNb2NrQWpheCh7XG4gICAgdHlwZTogJ2dldCcsXG4gICAgdXJsOiB0aGlzLnVybCxcbiAgICBkYXRhOiB7IG1ldGhvZDogJ2ZldGNoQ29tbWVudHMnLCBpZDogaWQgfSxcbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gIH0pO1xuXG4gIHJlcXVlc3QuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIHNlbGYuaW5zZXJ0Q29tbWVudHMocmVzcG9uc2UpO1xuICB9KTtcblxuICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3InKTtcbiAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gIH0pO1xufTtcblxuQ29tbWVudHMucHJvdG90eXBlLmluc2VydENvbW1lbnRzID0gZnVuY3Rpb24oY29tbWVudHMpIHtcbiAgdmFyIGh0bWwgPSB0aGlzLmNvbW1lbnRzVGVtcGxhdGUoeyBjb21tZW50czogY29tbWVudHMgfSk7XG4gIHRoaXMuJHRhcmdldC5hcHBlbmQoaHRtbCk7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB0aGlzLiR0YXJnZXQuZmluZCgnLmNvbW1lbnRzIGZvcm0nKS5zdWJtaXQoZnVuY3Rpb24oZSkge1xuICAgIHNlbGYucG9zdENvbW1lbnQoXG4gICAgICBzZWxmLnBvc3RJZCxcbiAgICAgIHNlbGYuJHRhcmdldC5maW5kKCcuY29tbWVudHMgZm9ybSAuYWRkLWNvbW1lbnQtbmFtZScpLnZhbCgpLFxuICAgICAgc2VsZi4kdGFyZ2V0LmZpbmQoJy5jb21tZW50cyBmb3JtIC5hZGQtY29tbWVudC10ZXh0JykudmFsKClcbiAgICApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSk7XG59O1xuXG5Db21tZW50cy5wcm90b3R5cGUucG9zdENvbW1lbnQgPSBmdW5jdGlvbihpZCwgbmFtZSwgdGV4dCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgb3ZlcmxheS5kaXNwbGF5KCk7XG5cbiAgLy8gdXNlIGEgY3VzdG9tIG1vY2sgYWpheCBvYmplY3QsIGxvb2tzIGxpa2UgJC5hamF4IHNvIGVhc3kgdG8gcGx1Z2luIHRvIHJlYWwgbGlicmFyeSBsYXRlclxuICB2YXIgcmVxdWVzdCA9IG5ldyBNb2NrQWpheCh7XG4gICAgdHlwZTogJ3Bvc3QnLFxuICAgIHVybDogdGhpcy51cmwsXG4gICAgZGF0YTogeyBtZXRob2Q6ICdwb3N0Q29tbWVudCcsIGlkOiBpZCwgbmFtZTogbmFtZSwgdGV4dDogdGV4dCB9LFxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgfSk7XG5cbiAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgLy8gc2VsZi5pbnNlcnRDb21tZW50cyhyZXNwb25zZSk7XG5cbiAgICAvLyBwcmVwZW5kIHRoZSBud2UgY29tbWVudCBhYm92ZSB0aGUgcmVzdCBoZXJlXG4gICAgLy8gc2hvdyBvdmVybGF5IHdoaWxlIHNhdmluZyB0aGUgY29tbWVudD9cbiAgICAvLyByZXNldCB0aGUgdGV4dCBmaWVsZHMgb24gc3VjY2VzZnVseSBzdWJtaXNzaW9uXG4gICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzdWNjZXNzJyk7XG4gICAgICBvdmVybGF5LnJlbW92ZSgpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yJyk7XG4gICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgIG92ZXJsYXkucmVtb3ZlKCk7XG4gIH0pO1xufTsiLCIvLyBpbnN0YW50aWF0ZSBNZWRpYXRvciBoZXJlLCAqIHNpbmdsZXRvbiAqXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBNZWRpYXRvcigpO1xuXG5mdW5jdGlvbiBNZWRpYXRvcigpIHtcbiAgdGhpcy5ldmVudHMgPSB7fTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbk1lZGlhdG9yLnByb3RvdHlwZS5wdWJsaXNoID0gZnVuY3Rpb24obXNnLCBkYXRhKSB7XG4gIGlmICh0aGlzLmV2ZW50c1ttc2ddKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmV2ZW50c1ttc2ddLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdGhpcy5ldmVudHNbbXNnXVtpXShkYXRhKTtcbiAgICB9XG4gIH1cbn07XG5cbk1lZGlhdG9yLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbihtc2csIGYpIHtcbiAgaWYgKCF0aGlzLmV2ZW50c1ttc2ddKSB7XG4gICAgdGhpcy5ldmVudHNbbXNnXSA9IFtdO1xuICB9XG5cbiAgdGhpcy5ldmVudHNbbXNnXS5wdXNoKGYpO1xufTtcbiIsIlxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vY2tBamF4O1xuXG5mdW5jdGlvbiBNb2NrQWpheChvcHRzKSB7XG4gIHRoaXMub3B0cyA9IG9wdHM7XG4gIHRoaXMucmVzcG9uc2UgPSBudWxsO1xuICB0aGlzLmRvbmVQcm9taXNlID0gbnVsbDtcbiAgdGhpcy5mYWlsUHJvbWlzZSA9IG51bGw7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIganNvblN0cmluZyA9IFwiXCI7XG5cbiAgLy8gdGhpcyBwYXJ0IGlzIGp1c3QgdG8gYnJpbmcgaW4gbW9jayBkYXRhIGRlcGVuZGluZyBvbiB0aGUgcmVxdWVzdFxuICBpZiAodGhpcy5vcHRzLmRhdGEubWV0aG9kID09ICdmZXRjaE9wdGlvbnMnKSB7XG4gICAganNvblN0cmluZyA9IFwiW1xcbiAgXFxcIkp1bmUgMjAxNVxcXCIsXFxuICBcXFwiTWF5IDIwMTVcXFwiLFxcbiAgXFxcIkFwcmlsIDIwMTVcXFwiLFxcbiAgXFxcIk1hcmNoIDIwMTVcXFwiLFxcbiAgXFxcIkZlYnJ1YXJ5IDIwMTVcXFwiLFxcbiAgXFxcIkphbnVhcnkgMjAxNVxcXCJcXG5dXCI7XG4gIH0gZWxzZSBpZiAodGhpcy5vcHRzLmRhdGEubWV0aG9kID09ICdmZXRjaEJsb2cnKSB7XG4gICAgaWYgKHRoaXMub3B0cy5kYXRhLmRhdGUgPT0gJ0p1bmUgMjAxNScpIHtcbiAgICAgIGpzb25TdHJpbmcgPSBcIntcXG4gIFxcXCJkYXRlXFxcIjogXFxcIkp1bmUgMjAxNVxcXCIsXFxuICBcXFwicG9zdHNcXFwiOiBbXFxuICAgIHtcXG4gICAgICBcXFwiaWRcXFwiOiA2LFxcbiAgICAgIFxcXCJ0aXRsZVxcXCI6IFxcXCJUaGUgZ3JlYXQgcG9zdFxcXCIsXFxuICAgICAgXFxcInRpbWVzdGFtcFxcXCI6IFxcXCJKdW5lIDEsIDIwMTUgYXQgMzowMCBQTVxcXCIsXFxuICAgICAgXFxcInRleHRcXFwiOiBcXFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdC4gTnVsbGFtIHNlbXBlciBtYXVyaXMgYWMganVzdG8gdGVtcG9yIGNvbnNlY3RldHVyLiBNb3JiaSByaG9uY3VzIGlhY3VsaXMgaXBzdW0gaWQgY29uZGltZW50dW0uIERvbmVjIGZhdWNpYnVzIGxlbyBzY2VsZXJpc3F1ZSBzY2VsZXJpc3F1ZSBhbGlxdWV0LiBNb3JiaSBjb25kaW1lbnR1bSBjb25ndWUgdmVoaWN1bGEuIEZ1c2NlIHRpbmNpZHVudCBlbmltIHRlbGx1cywgZWdldCBwb3J0YSBhdWd1ZSB0ZW1wb3IgdWx0cmljZXMuIFBlbGxlbnRlc3F1ZSBzdXNjaXBpdCBvcmNpIGlkIG1hdXJpcyBwb3N1ZXJlLCBuZWMgaWFjdWxpcyB0dXJwaXMgaWFjdWxpcy4gUHJhZXNlbnQgbWF0dGlzIGVuaW0gaWQgZHVpIG1heGltdXMsIGV1IGNvbnNlcXVhdCBkdWkgdHJpc3RpcXVlLiBOdWxsYW0gbWF4aW11cyBuaWJoIGF0IGV4IG1hdHRpcywgbmVjIHZlc3RpYnVsdW0gZXJvcyBtYXhpbXVzLiBQZWxsZW50ZXNxdWUgcXVpcyBmZXVnaWF0IGVyb3MuIE51bGxhbSB2aXRhZSBmcmluZ2lsbGEgbGVjdHVzLCBhdCBmYXVjaWJ1cyBtaS4gU3VzcGVuZGlzc2UgdmVsIHZpdmVycmEgbmliaC4gVmVzdGlidWx1bSBjb25ndWUgdXJuYSBlZ2V0IHZlbGl0IGxhb3JlZXQsIG5vbiBkaWduaXNzaW0gcHVydXMgZmF1Y2lidXMuIEludGVnZXIgbm9uIHNhZ2l0dGlzIG51bGxhLiBEdWlzIHV0IHRyaXN0aXF1ZSBtaSwgc2VkIHNjZWxlcmlzcXVlIGVzdC4gVml2YW11cyBzYXBpZW4gc2VtLCBmYXVjaWJ1cyBldCBmYXVjaWJ1cyBhYywgZmFjaWxpc2lzIGEgbGVvLiBOdW5jIGluIHNlbSBsaWJlcm8uIFxcXFxuU2VkIG1vbGxpcyB1cm5hIGFjIGVnZXN0YXMgdml2ZXJyYS4gVXQgaW4gZG9sb3IgZXQganVzdG8gaWFjdWxpcyBkaWduaXNzaW0uIE51bGxhIHBlbGxlbnRlc3F1ZSBsb3JlbSBldCB0ZWxsdXMgbGFjaW5pYSwgc2VkIGdyYXZpZGEgZHVpIG1hdHRpcy4gQ3JhcyBwb3N1ZXJlLCBlcmF0IGluIHRpbmNpZHVudCBkaWduaXNzaW0sIG9yY2kgbnVuYyBsdWN0dXMgZGlhbSwgdmVsIHVsdHJpY2llcyBzYXBpZW4gZGlhbSBpZCBtZXR1cy4gTnVuYyBhdWN0b3IsIGxlY3R1cyBzZWQgcnV0cnVtIGhlbmRyZXJpdCwgdXJuYSBvcmNpIGNvbmd1ZSBsaWJlcm8sIGV1IHNjZWxlcmlzcXVlIHJpc3VzIGZlbGlzIGVnZXQgdXJuYS4gVml2YW11cyBtb2xsaXMgZmVsaXMgZW5pbSwgdGluY2lkdW50IGN1cnN1cyBxdWFtIGdyYXZpZGEgZnJpbmdpbGxhLiBQaGFzZWxsdXMgbWFsZXN1YWRhIGEgZXN0IGVnZXQgZXVpc21vZC4gUHJhZXNlbnQgdmVuZW5hdGlzIGxlbyB2aXRhZSBhdWd1ZSBwb3J0dGl0b3Igc2NlbGVyaXNxdWUuIERvbmVjIGltcGVyZGlldCwgb2Rpby5cXFwiXFxuICAgIH1cXG4gIF1cXG59XCI7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdHMuZGF0YS5kYXRlID09ICdNYXkgMjAxNScpIHtcbiAgICAgIGpzb25TdHJpbmcgPSBcIntcXG4gIFxcXCJkYXRlXFxcIjogXFxcIk1heSAyMDE1XFxcIixcXG4gIFxcXCJwb3N0c1xcXCI6IFtcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDUsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBncmVhdCBwb3N0XFxcIixcXG4gICAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIk1heSAxLCAyMDE1IGF0IDM6MDAgUE1cXFwiLFxcbiAgICAgIFxcXCJ0ZXh0XFxcIjogXFxcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIE51bGxhbSBzZW1wZXIgbWF1cmlzIGFjIGp1c3RvIHRlbXBvciBjb25zZWN0ZXR1ci4gTW9yYmkgcmhvbmN1cyBpYWN1bGlzIGlwc3VtIGlkIGNvbmRpbWVudHVtLiBEb25lYyBmYXVjaWJ1cyBsZW8gc2NlbGVyaXNxdWUgc2NlbGVyaXNxdWUgYWxpcXVldC4gTW9yYmkgY29uZGltZW50dW0gY29uZ3VlIHZlaGljdWxhLiBGdXNjZSB0aW5jaWR1bnQgZW5pbSB0ZWxsdXMsIGVnZXQgcG9ydGEgYXVndWUgdGVtcG9yIHVsdHJpY2VzLiBQZWxsZW50ZXNxdWUgc3VzY2lwaXQgb3JjaSBpZCBtYXVyaXMgcG9zdWVyZSwgbmVjIGlhY3VsaXMgdHVycGlzIGlhY3VsaXMuIFByYWVzZW50IG1hdHRpcyBlbmltIGlkIGR1aSBtYXhpbXVzLCBldSBjb25zZXF1YXQgZHVpIHRyaXN0aXF1ZS4gTnVsbGFtIG1heGltdXMgbmliaCBhdCBleCBtYXR0aXMsIG5lYyB2ZXN0aWJ1bHVtIGVyb3MgbWF4aW11cy4gUGVsbGVudGVzcXVlIHF1aXMgZmV1Z2lhdCBlcm9zLiBOdWxsYW0gdml0YWUgZnJpbmdpbGxhIGxlY3R1cywgYXQgZmF1Y2lidXMgbWkuIFN1c3BlbmRpc3NlIHZlbCB2aXZlcnJhIG5pYmguIFZlc3RpYnVsdW0gY29uZ3VlIHVybmEgZWdldCB2ZWxpdCBsYW9yZWV0LCBub24gZGlnbmlzc2ltIHB1cnVzIGZhdWNpYnVzLiBJbnRlZ2VyIG5vbiBzYWdpdHRpcyBudWxsYS4gRHVpcyB1dCB0cmlzdGlxdWUgbWksIHNlZCBzY2VsZXJpc3F1ZSBlc3QuIFZpdmFtdXMgc2FwaWVuIHNlbSwgZmF1Y2lidXMgZXQgZmF1Y2lidXMgYWMsIGZhY2lsaXNpcyBhIGxlby4gTnVuYyBpbiBzZW0gbGliZXJvLiBcXFxcblNlZCBtb2xsaXMgdXJuYSBhYyBlZ2VzdGFzIHZpdmVycmEuIFV0IGluIGRvbG9yIGV0IGp1c3RvIGlhY3VsaXMgZGlnbmlzc2ltLiBOdWxsYSBwZWxsZW50ZXNxdWUgbG9yZW0gZXQgdGVsbHVzIGxhY2luaWEsIHNlZCBncmF2aWRhIGR1aSBtYXR0aXMuIENyYXMgcG9zdWVyZSwgZXJhdCBpbiB0aW5jaWR1bnQgZGlnbmlzc2ltLCBvcmNpIG51bmMgbHVjdHVzIGRpYW0sIHZlbCB1bHRyaWNpZXMgc2FwaWVuIGRpYW0gaWQgbWV0dXMuIE51bmMgYXVjdG9yLCBsZWN0dXMgc2VkIHJ1dHJ1bSBoZW5kcmVyaXQsIHVybmEgb3JjaSBjb25ndWUgbGliZXJvLCBldSBzY2VsZXJpc3F1ZSByaXN1cyBmZWxpcyBlZ2V0IHVybmEuIFZpdmFtdXMgbW9sbGlzIGZlbGlzIGVuaW0sIHRpbmNpZHVudCBjdXJzdXMgcXVhbSBncmF2aWRhIGZyaW5naWxsYS4gUGhhc2VsbHVzIG1hbGVzdWFkYSBhIGVzdCBlZ2V0IGV1aXNtb2QuIFByYWVzZW50IHZlbmVuYXRpcyBsZW8gdml0YWUgYXVndWUgcG9ydHRpdG9yIHNjZWxlcmlzcXVlLiBEb25lYyBpbXBlcmRpZXQsIG9kaW8uXFxcIlxcbiAgICB9XFxuICBdXFxufVwiO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRzLmRhdGEuZGF0ZSA9PSAnQXByaWwgMjAxNScpIHtcbiAgICAgIGpzb25TdHJpbmcgPSBcIntcXG4gIFxcXCJkYXRlXFxcIjogXFxcIkFwcmlsIDIwMTVcXFwiLFxcbiAgXFxcInBvc3RzXFxcIjogW1xcbiAgICB7XFxuICAgICAgXFxcImlkXFxcIjogNCxcXG4gICAgICBcXFwidGl0bGVcXFwiOiBcXFwiVGhlIGdyZWF0IHBvc3RcXFwiLFxcbiAgICAgIFxcXCJ0aW1lc3RhbXBcXFwiOiBcXFwiQXByaWwgMSwgMjAxNSBhdCAzOjAwIFBNXFxcIixcXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuIE1vcmJpIGNvbmRpbWVudHVtIGNvbmd1ZSB2ZWhpY3VsYS4gRnVzY2UgdGluY2lkdW50IGVuaW0gdGVsbHVzLCBlZ2V0IHBvcnRhIGF1Z3VlIHRlbXBvciB1bHRyaWNlcy4gUGVsbGVudGVzcXVlIHN1c2NpcGl0IG9yY2kgaWQgbWF1cmlzIHBvc3VlcmUsIG5lYyBpYWN1bGlzIHR1cnBpcyBpYWN1bGlzLiBQcmFlc2VudCBtYXR0aXMgZW5pbSBpZCBkdWkgbWF4aW11cywgZXUgY29uc2VxdWF0IGR1aSB0cmlzdGlxdWUuIE51bGxhbSBtYXhpbXVzIG5pYmggYXQgZXggbWF0dGlzLCBuZWMgdmVzdGlidWx1bSBlcm9zIG1heGltdXMuIFBlbGxlbnRlc3F1ZSBxdWlzIGZldWdpYXQgZXJvcy4gTnVsbGFtIHZpdGFlIGZyaW5naWxsYSBsZWN0dXMsIGF0IGZhdWNpYnVzIG1pLiBTdXNwZW5kaXNzZSB2ZWwgdml2ZXJyYSBuaWJoLiBWZXN0aWJ1bHVtIGNvbmd1ZSB1cm5hIGVnZXQgdmVsaXQgbGFvcmVldCwgbm9uIGRpZ25pc3NpbSBwdXJ1cyBmYXVjaWJ1cy4gSW50ZWdlciBub24gc2FnaXR0aXMgbnVsbGEuIER1aXMgdXQgdHJpc3RpcXVlIG1pLCBzZWQgc2NlbGVyaXNxdWUgZXN0LiBWaXZhbXVzIHNhcGllbiBzZW0sIGZhdWNpYnVzIGV0IGZhdWNpYnVzIGFjLCBmYWNpbGlzaXMgYSBsZW8uIE51bmMgaW4gc2VtIGxpYmVyby4gXFxcXG5TZWQgbW9sbGlzIHVybmEgYWMgZWdlc3RhcyB2aXZlcnJhLiBVdCBpbiBkb2xvciBldCBqdXN0byBpYWN1bGlzIGRpZ25pc3NpbS4gTnVsbGEgcGVsbGVudGVzcXVlIGxvcmVtIGV0IHRlbGx1cyBsYWNpbmlhLCBzZWQgZ3JhdmlkYSBkdWkgbWF0dGlzLiBDcmFzIHBvc3VlcmUsIGVyYXQgaW4gdGluY2lkdW50IGRpZ25pc3NpbSwgb3JjaSBudW5jIGx1Y3R1cyBkaWFtLCB2ZWwgdWx0cmljaWVzIHNhcGllbiBkaWFtIGlkIG1ldHVzLiBOdW5jIGF1Y3RvciwgbGVjdHVzIHNlZCBydXRydW0gaGVuZHJlcml0LCB1cm5hIG9yY2kgY29uZ3VlIGxpYmVybywgZXUgc2NlbGVyaXNxdWUgcmlzdXMgZmVsaXMgZWdldCB1cm5hLiBWaXZhbXVzIG1vbGxpcyBmZWxpcyBlbmltLCB0aW5jaWR1bnQgY3Vyc3VzIHF1YW0gZ3JhdmlkYSBmcmluZ2lsbGEuIFBoYXNlbGx1cyBtYWxlc3VhZGEgYSBlc3QgZWdldCBldWlzbW9kLiBQcmFlc2VudCB2ZW5lbmF0aXMgbGVvIHZpdGFlIGF1Z3VlIHBvcnR0aXRvciBzY2VsZXJpc3F1ZS4gRG9uZWMgaW1wZXJkaWV0LCBvZGlvLlxcXCJcXG4gICAgfVxcbiAgXVxcbn1cIjtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0cy5kYXRhLmRhdGUgPT0gJ01hcmNoIDIwMTUnKSB7XG4gICAgICBqc29uU3RyaW5nID0gXCJ7XFxuICBcXFwiZGF0ZVxcXCI6IFxcXCJNYXJjaCAyMDE1XFxcIixcXG4gIFxcXCJwb3N0c1xcXCI6IFtcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDMsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBncmVhdCBwb3N0XFxcIixcXG4gICAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIk1hcmNoIDEsIDIwMTUgYXQgMzowMCBQTVxcXCIsXFxuICAgICAgXFxcInRleHRcXFwiOiBcXFwiTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdC4gTnVsbGFtIHNlbXBlciBtYXVyaXMgYWMganVzdG8gdGVtcG9yIGNvbnNlY3RldHVyLiBNb3JiaSByaG9uY3VzIGlhY3VsaXMgaXBzdW0gaWQgY29uZGltZW50dW0uIERvbmVjIGZhdWNpYnVzIGxlbyBzY2VsZXJpc3F1ZSBzY2VsZXJpc3F1ZSBhbGlxdWV0LiBNb3JiaSBjb25kaW1lbnR1bSBjb25ndWUgdmVoaWN1bGEuIEZ1c2NlIHRpbmNpZHVudCBlbmltIHRlbGx1cywgZWdldCBwb3J0YSBhdWd1ZSB0ZW1wb3IgdWx0cmljZXMuIFBlbGxlbnRlc3F1ZSBzdXNjaXBpdCBvcmNpIGlkIG1hdXJpcyBwb3N1ZXJlLCBuZWMgaWFjdWxpcyB0dXJwaXMgaWFjdWxpcy4gUHJhZXNlbnQgbWF0dGlzIGVuaW0gaWQgZHVpIG1heGltdXMsIGV1IGNvbnNlcXVhdCBkdWkgdHJpc3RpcXVlLiBOdWxsYW0gbWF4aW11cyBuaWJoIGF0IGV4IG1hdHRpcywgbmVjIHZlc3RpYnVsdW0gZXJvcyBtYXhpbXVzLiBQZWxsZW50ZXNxdWUgcXVpcyBmZXVnaWF0IGVyb3MuIE51bGxhbSB2aXRhZSBmcmluZ2lsbGEgbGVjdHVzLCBhdCBmYXVjaWJ1cyBtaS4gU3VzcGVuZGlzc2UgdmVsIHZpdmVycmEgbmliaC4gVmVzdGlidWx1bSBjb25ndWUgdXJuYSBlZ2V0IHZlbGl0IGxhb3JlZXQsIG5vbiBkaWduaXNzaW0gcHVydXMgZmF1Y2lidXMuIEludGVnZXIgbm9uIHNhZ2l0dGlzIG51bGxhLiBEdWlzIHV0IHRyaXN0aXF1ZSBtaSwgc2VkIHNjZWxlcmlzcXVlIGVzdC4gVml2YW11cyBzYXBpZW4gc2VtLCBmYXVjaWJ1cyBldCBmYXVjaWJ1cyBhYywgZmFjaWxpc2lzIGEgbGVvLiBOdW5jIGluIHNlbSBsaWJlcm8uIFxcXFxuU2VkIG1vbGxpcyB1cm5hIGFjIGVnZXN0YXMgdml2ZXJyYS4gVXQgaW4gZG9sb3IgZXQganVzdG8gaWFjdWxpcyBkaWduaXNzaW0uIE51bGxhIHBlbGxlbnRlc3F1ZSBsb3JlbSBldCB0ZWxsdXMgbGFjaW5pYSwgc2VkIGdyYXZpZGEgZHVpIG1hdHRpcy4gQ3JhcyBwb3N1ZXJlLCBlcmF0IGluIHRpbmNpZHVudCBkaWduaXNzaW0sIG9yY2kgbnVuYyBsdWN0dXMgZGlhbSwgdmVsIHVsdHJpY2llcyBzYXBpZW4gZGlhbSBpZCBtZXR1cy4gTnVuYyBhdWN0b3IsIGxlY3R1cyBzZWQgcnV0cnVtIGhlbmRyZXJpdCwgdXJuYSBvcmNpIGNvbmd1ZSBsaWJlcm8sIGV1IHNjZWxlcmlzcXVlIHJpc3VzIGZlbGlzIGVnZXQgdXJuYS4gVml2YW11cyBtb2xsaXMgZmVsaXMgZW5pbSwgdGluY2lkdW50IGN1cnN1cyBxdWFtIGdyYXZpZGEgZnJpbmdpbGxhLiBQaGFzZWxsdXMgbWFsZXN1YWRhIGEgZXN0IGVnZXQgZXVpc21vZC4gUHJhZXNlbnQgdmVuZW5hdGlzIGxlbyB2aXRhZSBhdWd1ZSBwb3J0dGl0b3Igc2NlbGVyaXNxdWUuIERvbmVjIGltcGVyZGlldCwgb2Rpby5cXFwiXFxuICAgIH1cXG4gIF1cXG59XCI7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdHMuZGF0YS5kYXRlID09ICdGZWJydWFyeSAyMDE1Jykge1xuICAgICAganNvblN0cmluZyA9IFwie1xcbiAgXFxcImRhdGVcXFwiOiBcXFwiRmVicnVhcnkgMjAxNVxcXCIsXFxuICBcXFwicG9zdHNcXFwiOiBbXFxuICAgIHtcXG4gICAgICBcXFwiaWRcXFwiOiAyLFxcbiAgICAgIFxcXCJ0aXRsZVxcXCI6IFxcXCJUaGUgZ3JlYXQgcG9zdFxcXCIsXFxuICAgICAgXFxcInRpbWVzdGFtcFxcXCI6IFxcXCJGZWJydWFyeSAxLCAyMDE1IGF0IDM6MDAgUE1cXFwiLFxcbiAgICAgIFxcXCJ0ZXh0XFxcIjogXFxcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIE51bGxhbSBzZW1wZXIgbWF1cmlzIGFjIGp1c3RvIHRlbXBvciBjb25zZWN0ZXR1ci4gTW9yYmkgcmhvbmN1cyBpYWN1bGlzIGlwc3VtIGlkIGNvbmRpbWVudHVtLiBEb25lYyBmYXVjaWJ1cyBsZW8gc2NlbGVyaXNxdWUgc2NlbGVyaXNxdWUgYWxpcXVldC4gTW9yYmkgY29uZGltZW50dW0gY29uZ3VlIHZlaGljdWxhLiBGdXNjZSB0aW5jaWR1bnQgZW5pbSB0ZWxsdXMsIGVnZXQgcG9ydGEgYXVndWUgdGVtcG9yIHVsdHJpY2VzLiBQZWxsZW50ZXNxdWUgc3VzY2lwaXQgb3JjaSBpZCBtYXVyaXMgcG9zdWVyZSwgbmVjIGlhY3VsaXMgdHVycGlzIGlhY3VsaXMuIFByYWVzZW50IG1hdHRpcyBlbmltIGlkIGR1aSBtYXhpbXVzLCBldSBjb25zZXF1YXQgZHVpIHRyaXN0aXF1ZS4gTnVsbGFtIG1heGltdXMgbmliaCBhdCBleCBtYXR0aXMsIG5lYyB2ZXN0aWJ1bHVtIGVyb3MgbWF4aW11cy4gUGVsbGVudGVzcXVlIHF1aXMgZmV1Z2lhdCBlcm9zLiBOdWxsYW0gdml0YWUgZnJpbmdpbGxhIGxlY3R1cywgYXQgZmF1Y2lidXMgbWkuIFN1c3BlbmRpc3NlIHZlbCB2aXZlcnJhIG5pYmguIFZlc3RpYnVsdW0gY29uZ3VlIHVybmEgZWdldCB2ZWxpdCBsYW9yZWV0LCBub24gZGlnbmlzc2ltIHB1cnVzIGZhdWNpYnVzLiBJbnRlZ2VyIG5vbiBzYWdpdHRpcyBudWxsYS4gRHVpcyB1dCB0cmlzdGlxdWUgbWksIHNlZCBzY2VsZXJpc3F1ZSBlc3QuIFZpdmFtdXMgc2FwaWVuIHNlbSwgZmF1Y2lidXMgZXQgZmF1Y2lidXMgYWMsIGZhY2lsaXNpcyBhIGxlby4gTnVuYyBpbiBzZW0gbGliZXJvLiBcXFxcblNlZCBtb2xsaXMgdXJuYSBhYyBlZ2VzdGFzIHZpdmVycmEuIFV0IGluIGRvbG9yIGV0IGp1c3RvIGlhY3VsaXMgZGlnbmlzc2ltLiBOdWxsYSBwZWxsZW50ZXNxdWUgbG9yZW0gZXQgdGVsbHVzIGxhY2luaWEsIHNlZCBncmF2aWRhIGR1aSBtYXR0aXMuIENyYXMgcG9zdWVyZSwgZXJhdCBpbiB0aW5jaWR1bnQgZGlnbmlzc2ltLCBvcmNpIG51bmMgbHVjdHVzIGRpYW0sIHZlbCB1bHRyaWNpZXMgc2FwaWVuIGRpYW0gaWQgbWV0dXMuIE51bmMgYXVjdG9yLCBsZWN0dXMgc2VkIHJ1dHJ1bSBoZW5kcmVyaXQsIHVybmEgb3JjaSBjb25ndWUgbGliZXJvLCBldSBzY2VsZXJpc3F1ZSByaXN1cyBmZWxpcyBlZ2V0IHVybmEuIFZpdmFtdXMgbW9sbGlzIGZlbGlzIGVuaW0sIHRpbmNpZHVudCBjdXJzdXMgcXVhbSBncmF2aWRhIGZyaW5naWxsYS4gUGhhc2VsbHVzIG1hbGVzdWFkYSBhIGVzdCBlZ2V0IGV1aXNtb2QuIFByYWVzZW50IHZlbmVuYXRpcyBsZW8gdml0YWUgYXVndWUgcG9ydHRpdG9yIHNjZWxlcmlzcXVlLiBEb25lYyBpbXBlcmRpZXQsIG9kaW8uXFxcIlxcbiAgICB9XFxuICBdXFxufVwiO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRzLmRhdGEuZGF0ZSA9PSAnSmFudWFyeSAyMDE1Jykge1xuICAgICAganNvblN0cmluZyA9IFwie1xcbiAgXFxcImRhdGVcXFwiOiBcXFwiSmFudWFyeSAyMDE1XFxcIixcXG4gIFxcXCJwb3N0c1xcXCI6IFtcXG4gICAge1xcbiAgICAgIFxcXCJpZFxcXCI6IDEsXFxuICAgICAgXFxcInRpdGxlXFxcIjogXFxcIlRoZSBncmVhdCBwb3N0XFxcIixcXG4gICAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkphbnVhcnkgMSwgMjAxNSBhdCAzOjAwIFBNXFxcIixcXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuIE1vcmJpIGNvbmRpbWVudHVtIGNvbmd1ZSB2ZWhpY3VsYS4gRnVzY2UgdGluY2lkdW50IGVuaW0gdGVsbHVzLCBlZ2V0IHBvcnRhIGF1Z3VlIHRlbXBvciB1bHRyaWNlcy4gUGVsbGVudGVzcXVlIHN1c2NpcGl0IG9yY2kgaWQgbWF1cmlzIHBvc3VlcmUsIG5lYyBpYWN1bGlzIHR1cnBpcyBpYWN1bGlzLiBQcmFlc2VudCBtYXR0aXMgZW5pbSBpZCBkdWkgbWF4aW11cywgZXUgY29uc2VxdWF0IGR1aSB0cmlzdGlxdWUuIE51bGxhbSBtYXhpbXVzIG5pYmggYXQgZXggbWF0dGlzLCBuZWMgdmVzdGlidWx1bSBlcm9zIG1heGltdXMuIFBlbGxlbnRlc3F1ZSBxdWlzIGZldWdpYXQgZXJvcy4gTnVsbGFtIHZpdGFlIGZyaW5naWxsYSBsZWN0dXMsIGF0IGZhdWNpYnVzIG1pLiBTdXNwZW5kaXNzZSB2ZWwgdml2ZXJyYSBuaWJoLiBWZXN0aWJ1bHVtIGNvbmd1ZSB1cm5hIGVnZXQgdmVsaXQgbGFvcmVldCwgbm9uIGRpZ25pc3NpbSBwdXJ1cyBmYXVjaWJ1cy4gSW50ZWdlciBub24gc2FnaXR0aXMgbnVsbGEuIER1aXMgdXQgdHJpc3RpcXVlIG1pLCBzZWQgc2NlbGVyaXNxdWUgZXN0LiBWaXZhbXVzIHNhcGllbiBzZW0sIGZhdWNpYnVzIGV0IGZhdWNpYnVzIGFjLCBmYWNpbGlzaXMgYSBsZW8uIE51bmMgaW4gc2VtIGxpYmVyby4gXFxcXG5TZWQgbW9sbGlzIHVybmEgYWMgZWdlc3RhcyB2aXZlcnJhLiBVdCBpbiBkb2xvciBldCBqdXN0byBpYWN1bGlzIGRpZ25pc3NpbS4gTnVsbGEgcGVsbGVudGVzcXVlIGxvcmVtIGV0IHRlbGx1cyBsYWNpbmlhLCBzZWQgZ3JhdmlkYSBkdWkgbWF0dGlzLiBDcmFzIHBvc3VlcmUsIGVyYXQgaW4gdGluY2lkdW50IGRpZ25pc3NpbSwgb3JjaSBudW5jIGx1Y3R1cyBkaWFtLCB2ZWwgdWx0cmljaWVzIHNhcGllbiBkaWFtIGlkIG1ldHVzLiBOdW5jIGF1Y3RvciwgbGVjdHVzIHNlZCBydXRydW0gaGVuZHJlcml0LCB1cm5hIG9yY2kgY29uZ3VlIGxpYmVybywgZXUgc2NlbGVyaXNxdWUgcmlzdXMgZmVsaXMgZWdldCB1cm5hLiBWaXZhbXVzIG1vbGxpcyBmZWxpcyBlbmltLCB0aW5jaWR1bnQgY3Vyc3VzIHF1YW0gZ3JhdmlkYSBmcmluZ2lsbGEuIFBoYXNlbGx1cyBtYWxlc3VhZGEgYSBlc3QgZWdldCBldWlzbW9kLiBQcmFlc2VudCB2ZW5lbmF0aXMgbGVvIHZpdGFlIGF1Z3VlIHBvcnR0aXRvciBzY2VsZXJpc3F1ZS4gRG9uZWMgaW1wZXJkaWV0LCBvZGlvLlxcXCJcXG4gICAgfVxcbiAgXVxcbn1cIjtcbiAgICB9XG4gIH0gZWxzZSBpZiAodGhpcy5vcHRzLmRhdGEubWV0aG9kID09ICdmZXRjaENvbW1lbnRzJykge1xuICAgIGpzb25TdHJpbmcgPSBcIltcXG4gIHtcXG4gICAgXFxcIm5hbWVcXFwiOiBcXFwiVGhpcyBndXlcXFwiLFxcbiAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkp1bmUgMiAyMDE1IGF0IDQ6MDAgUE1cXFwiLFxcbiAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuXFxcIlxcbiAgfSxcXG4gIHtcXG4gICAgXFxcIm5hbWVcXFwiOiBcXFwiVGhhdCBndXlcXFwiLFxcbiAgICBcXFwidGltZXN0YW1wXFxcIjogXFxcIkp1bmUgMiAyMDE1IGF0IDQ6MDAgUE1cXFwiLFxcbiAgICBcXFwidGV4dFxcXCI6IFxcXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBOdWxsYW0gc2VtcGVyIG1hdXJpcyBhYyBqdXN0byB0ZW1wb3IgY29uc2VjdGV0dXIuIE1vcmJpIHJob25jdXMgaWFjdWxpcyBpcHN1bSBpZCBjb25kaW1lbnR1bS4gRG9uZWMgZmF1Y2lidXMgbGVvIHNjZWxlcmlzcXVlIHNjZWxlcmlzcXVlIGFsaXF1ZXQuXFxcIlxcbiAgfVxcbl1cIjtcbiAgfSBlbHNlIGlmICh0aGlzLm9wdHMuZGF0YS5tZXRob2QgPT0gJ3Bvc3RDb21tZW50Jykge1xuICAgIGpzb25TdHJpbmcgPSBcIntcXG4gIFxcXCJzdWNjZXNzXFxcIjogdHJ1ZVxcbn1cIjtcbiAgfVxuXG4gIHRoaXMucmVzcG9uc2UgPSBKU09OLnBhcnNlKGpzb25TdHJpbmcpO1xuXG4gIC8vIHNldCB0aW1lciB0byBydW4gdGhpcy5kb25lUHJvbWlzZSBhZnRlciBzb21lIHRpbWVvdXQsIHNpbXVsYXRlIGEgbmV0d29yayBkZWxheVxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLmRvbmVQcm9taXNlKSB7XG4gICAgICBzZWxmLmRvbmVQcm9taXNlKHNlbGYucmVzcG9uc2UpO1xuICAgIH1cbiAgfSwgMjAwKTtcblxuICByZXR1cm4gdGhpcztcbn1cblxuTW9ja0FqYXgucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbihmKSB7XG4gIHRoaXMuZG9uZVByb21pc2UgPSBmO1xufTtcblxuTW9ja0FqYXgucHJvdG90eXBlLmZhaWwgPSBmdW5jdGlvbihmKSB7XG4gIHRoaXMuZmFpbFByb21pc2UgPSBmO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IG5ldyBPdmVybGF5KCk7XG5cbmZ1bmN0aW9uIE92ZXJsYXkoKSB7XG4gIHRoaXMudGltZXIgPSBudWxsO1xuICB0aGlzLmltYWdlID0gbnVsbDtcbiAgdGhpcy5oZWlnaHQgPSAwO1xuICB0aGlzLndpZHRoID0gMDtcbiAgdGhpcy4kaW1nID0gbnVsbDtcbiAgdGhpcy5mcmFtZXMgPSAwO1xuICB0aGlzLmludGVydmFsID0gMDtcbiAgdGhpcy54ID0gMDtcbiAgdGhpcy5pbmRleCA9IDA7XG59XG5cbk92ZXJsYXkucHJvdG90eXBlLnNldENvbmZpZyA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgdGhpcy50aW1lciA9IG51bGw7XG4gIHRoaXMuaGVpZ2h0ID0gYXJncy5oZWlnaHQ7XG4gIHRoaXMud2lkdGggPSBhcmdzLndpZHRoO1xuICB0aGlzLiRpbWcgPSBhcmdzLmltZztcbiAgdGhpcy4kb3ZlcmxheSA9IGFyZ3Mub3ZlcmxheTtcbiAgdGhpcy5mcmFtZXMgPSBhcmdzLmZyYW1lcztcbiAgdGhpcy5pbnRlcnZhbCA9IGFyZ3MuaW50ZXJ2YWw7XG4gIHRoaXMueCA9IDA7XG4gIHRoaXMuaW5kZXggPSAwO1xuICB0aGlzLmltYWdlID0gbmV3IEltYWdlKCk7XG4gIHRoaXMuaW1hZ2Uuc3JjID0gYXJncy5zcmM7XG4gIHRoaXMuJGltZy5jc3MoJ2JhY2tncm91bmRJbWFnZScsICd1cmwoJyArIHRoaXMuaW1hZ2Uuc3JjICsgJyknKTtcbiAgdGhpcy4kaW1nLndpZHRoKHRoaXMud2lkdGggKyAncHgnKTtcbiAgdGhpcy4kaW1nLmhlaWdodCh0aGlzLmhlaWdodCArICdweCcpO1xufTtcblxuT3ZlcmxheS5wcm90b3R5cGUuZGlzcGxheSA9IGZ1bmN0aW9uKCkge1xuICAvLyBzaG93IHRoZSBvdmVybGF5XG4gIGlmICh0aGlzLnRpbWVyID09PSBudWxsKSB7XG4gICAgdGhpcy5hbmltYXRlKCk7XG4gICAgdGhpcy4kb3ZlcmxheS5zaG93KCk7XG4gIH1cbn07XG5cbk92ZXJsYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBoaWRlIHRoZSBvdmVybGF5XG4gIHRoaXMuJG92ZXJsYXkuaGlkZSgpO1xuICBjbGVhclRpbWVvdXQodGhpcy50aW1lcik7XG4gIHRoaXMudGltZXIgPSBudWxsO1xuICB0aGlzLnggPSAwO1xuICB0aGlzLmluZGV4ID0gMDtcbn07XG5cbk92ZXJsYXkucHJvdG90eXBlLmFuaW1hdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy4kaW1nLmNzcygnYmFja2dyb3VuZFBvc2l0aW9uJywgdGhpcy54ICsgJ3B4IDAnKTtcbiAgdGhpcy54IC09IHRoaXMud2lkdGg7XG4gIHRoaXMuaW5kZXgrKztcblxuICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLmZyYW1lcykge1xuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy5pbmRleCA9IDA7XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdGhpcy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5hbmltYXRlKCk7XG4gIH0sIHRoaXMuaW50ZXJ2YWwpO1xufTsiLCJcbnZhciBtZWRpYXRvciA9IHJlcXVpcmUoJy4uL21lZGlhdG9yL21lZGlhdG9yJyk7XG52YXIgTW9ja0FqYXggPSByZXF1aXJlKCcuLi9tb2NrX2FqYXgvbW9ja19hamF4Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2lkZWJhcjtcblxuZnVuY3Rpb24gU2lkZWJhcihvcHRzKSB7XG4gIHZhciBodG1sID0gXCI8ZGl2IGNsYXNzPVxcXCJzaWRlYmFyXFxcIj5cXG4gICA8dWw+PC91bD5cXG4gICA8aHI+XFxuPC9kaXY+XFxuXCI7XG4gIHRoaXMuJGVsID0gJChodG1sKTtcbiAgdGhpcy5lbGVtZW50c1RlbXBsYXRlID0gXy50ZW1wbGF0ZShcIjwlIF8uZWFjaChlbGVtZW50cywgZnVuY3Rpb24oZWwsIGkpIHsgJT5cXG4gIDxsaTwlPSBpID09IDAgPyAnIGNsYXNzPVxcXCJhY3RpdmVcXFwiJyA6ICcnICU+PlxcbiAgICA8YSBocmVmPVxcXCJqYXZhc2NyaXB0OiB2b2lkKDApO1xcXCI+PCU9IGVsICU+PC9hPlxcbiAgPC9saT5cXG48JSB9KTsgJT5cXG5cIik7XG4gIHRoaXMudXJsID0gb3B0cy51cmw7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIG1lZGlhdG9yLnN1YnNjcmliZSgncGFnZS1pbml0JywgZnVuY3Rpb24oKSB7ICBcbiAgICBzZWxmLmZldGNoT3B0aW9ucygpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn1cblxuU2lkZWJhci5wcm90b3R5cGUuYXBwZW5kVG8gPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgJCh0YXJnZXQpLmFwcGVuZCh0aGlzLiRlbCk7XG59O1xuXG5TaWRlYmFyLnByb3RvdHlwZS5mZXRjaE9wdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIC8vIHVzZSBhIGN1c3RvbSBtb2NrIGFqYXggb2JqZWN0LCBsb29rcyBsaWtlICQuYWpheCBzbyBlYXN5IHRvIHBsdWdpbiB0byByZWFsIGxpYnJhcnkgbGF0ZXJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgTW9ja0FqYXgoe1xuICAgIHR5cGU6ICdnZXQnLFxuICAgIHVybDogdGhpcy51cmwsXG4gICAgZGF0YTogeyBtZXRob2Q6ICdmZXRjaE9wdGlvbnMnIH0sXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICB9KTtcblxuICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBzZWxmLmluc2VydE9wdGlvbnMocmVzcG9uc2UpO1xuICAgIG1lZGlhdG9yLnB1Ymxpc2goJ29wdGlvbi1zZWxlY3RlZCcsIHsgZGF0ZTogcmVzcG9uc2VbMF0gfSk7XG4gIH0pO1xuXG4gIHJlcXVlc3QuZmFpbChmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKCdlcnJvcicpO1xuICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgfSk7XG59O1xuXG5TaWRlYmFyLnByb3RvdHlwZS5pbnNlcnRPcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgJHVsID0gdGhpcy4kZWwuZmluZCgndWwnKTtcbiAgJHVsLmFwcGVuZCh0aGlzLmVsZW1lbnRzVGVtcGxhdGUoeyBlbGVtZW50czogb3B0aW9ucyB9KSk7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICR1bC5maW5kKCdhJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgdmFyICRhID0gJCh0aGlzKTtcbiAgICB2YXIgJHBhcmVudCA9ICRhLnBhcmVudCgpO1xuXG4gICAgaWYgKCRwYXJlbnQuaGFzQ2xhc3MoJ2FjdGl2ZScpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi4kZWwuZmluZCgnbGkuYWN0aXZlJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICRwYXJlbnQuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIG1lZGlhdG9yLnB1Ymxpc2goJ29wdGlvbi1zZWxlY3RlZCcsIHsgZGF0ZTogJGEudGV4dCgpIH0pO1xuICB9KTtcbn07Il19
