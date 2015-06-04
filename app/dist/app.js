(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var mediator = require('./modules/mediator/mediator');
var Sidebar = require('./modules/sidebar/sidebar');
var Blog = require('./modules/blog/blog');

var applicationStart = function() {
  // setup initial page skeleton
  var html = "<div class=\"container-fluid\">\n  <div class=\"row\">\n    <div id=\"sidebar-container\" class=\"col-sm-3 col-md-2\"></div>\n    <div id=\"blog-container\" class=\"col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2\"></div>\n  </div>\n</div>";
  $('#main-page-content').html(html);

  // instantiate modules
  var sidebar = new Sidebar({ url: null });
  var blog = new Blog();

  // display the modules
  sidebar.appendTo('#sidebar-container');
  blog.appendTo('#blog-container');

  mediator.publish('page-init', {});
};

$(document).ready(applicationStart);
},{"./modules/blog/blog":2,"./modules/mediator/mediator":3,"./modules/sidebar/sidebar":5}],2:[function(require,module,exports){

var mediator = require('../mediator/mediator');

module.exports = Blog;

function Blog() {
  var html = "<h1 class=\"page-header\">Blog <small><%= blog.date %></small></h1>";
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
},{"../mediator/mediator":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){


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
  }

  this.response = JSON.parse(jsonString);
  
  // set timer to run this.donePromise after some timeout, simulate a network delay
  setTimeout(function() {
    if (self.donePromise) {
      self.donePromise(self.response);
    }
  }, 100);

  return this;
}

MockAjax.prototype.done = function(f) {
  this.donePromise = f;
};

MockAjax.prototype.fail = function(f) {
  this.failPromise = f;
};
},{}],5:[function(require,module,exports){

var mediator = require('../mediator/mediator');
var MockAjax = require('../mock_ajax/mock_ajax');

module.exports = Sidebar;

function Sidebar(opts) {
  var html = "<div class=\"sidebar\">\n   <ul></ul>\n   <hr>\n</div>\n";
  this.$el = $(html);
  this.elementsTemplate = _.template("<% _.each(elements, function(el, i) { %>\n  <li<%= i == 0 ? ' class=\"active\"' : '' %>>\n    <a href=\"javascript: void(0);\"><%= el %></a>\n  </li>\n<% }); %>\n\n<li>\n  <a href=\"javascript: void(0);\">\n    <span class=\"glyphicon glyphicon glyphicon glyphicon-option-horizontal\"></span>\n  </a>\n</li>\n");
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
    var $this = $(this);
    self.$el.find('li.active').removeClass('active');
    $this.parent().addClass('active');
    mediator.publish('option-selected', { date: $this.text() });
  });
};
},{"../mediator/mediator":3,"../mock_ajax/mock_ajax":4}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc3JjL21haW4uanMiLCJhcHAvc3JjL21vZHVsZXMvYmxvZy9ibG9nLmpzIiwiYXBwL3NyYy9tb2R1bGVzL21lZGlhdG9yL21lZGlhdG9yLmpzIiwiYXBwL3NyYy9tb2R1bGVzL21vY2tfYWpheC9tb2NrX2FqYXguanMiLCJhcHAvc3JjL21vZHVsZXMvc2lkZWJhci9zaWRlYmFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbnZhciBtZWRpYXRvciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9tZWRpYXRvci9tZWRpYXRvcicpO1xudmFyIFNpZGViYXIgPSByZXF1aXJlKCcuL21vZHVsZXMvc2lkZWJhci9zaWRlYmFyJyk7XG52YXIgQmxvZyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9ibG9nL2Jsb2cnKTtcblxudmFyIGFwcGxpY2F0aW9uU3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgLy8gc2V0dXAgaW5pdGlhbCBwYWdlIHNrZWxldG9uXG4gIHZhciBodG1sID0gXCI8ZGl2IGNsYXNzPVxcXCJjb250YWluZXItZmx1aWRcXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwicm93XFxcIj5cXG4gICAgPGRpdiBpZD1cXFwic2lkZWJhci1jb250YWluZXJcXFwiIGNsYXNzPVxcXCJjb2wtc20tMyBjb2wtbWQtMlxcXCI+PC9kaXY+XFxuICAgIDxkaXYgaWQ9XFxcImJsb2ctY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiY29sLXNtLTkgY29sLXNtLW9mZnNldC0zIGNvbC1tZC0xMCBjb2wtbWQtb2Zmc2V0LTJcXFwiPjwvZGl2PlxcbiAgPC9kaXY+XFxuPC9kaXY+XCI7XG4gICQoJyNtYWluLXBhZ2UtY29udGVudCcpLmh0bWwoaHRtbCk7XG5cbiAgLy8gaW5zdGFudGlhdGUgbW9kdWxlc1xuICB2YXIgc2lkZWJhciA9IG5ldyBTaWRlYmFyKHsgdXJsOiBudWxsIH0pO1xuICB2YXIgYmxvZyA9IG5ldyBCbG9nKCk7XG5cbiAgLy8gZGlzcGxheSB0aGUgbW9kdWxlc1xuICBzaWRlYmFyLmFwcGVuZFRvKCcjc2lkZWJhci1jb250YWluZXInKTtcbiAgYmxvZy5hcHBlbmRUbygnI2Jsb2ctY29udGFpbmVyJyk7XG5cbiAgbWVkaWF0b3IucHVibGlzaCgncGFnZS1pbml0Jywge30pO1xufTtcblxuJChkb2N1bWVudCkucmVhZHkoYXBwbGljYXRpb25TdGFydCk7IiwiXG52YXIgbWVkaWF0b3IgPSByZXF1aXJlKCcuLi9tZWRpYXRvci9tZWRpYXRvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2c7XG5cbmZ1bmN0aW9uIEJsb2coKSB7XG4gIHZhciBodG1sID0gXCI8aDEgY2xhc3M9XFxcInBhZ2UtaGVhZGVyXFxcIj5CbG9nIDxzbWFsbD48JT0gYmxvZy5kYXRlICU+PC9zbWFsbD48L2gxPlwiO1xuICB0aGlzLiRlbCA9ICQoaHRtbCk7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIG1lZGlhdG9yLnN1YnNjcmliZSgnb3B0aW9uLXNlbGVjdGVkJywgZnVuY3Rpb24oYXJncykge1xuICAgIHNlbGYuZmV0Y2hCbG9nKGFyZ3MuZGF0ZSk7XG4gIH0pO1xufVxuXG5CbG9nLnByb3RvdHlwZS5hcHBlbmRUbyA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAkKHRhcmdldCkuYXBwZW5kKHRoaXMuJGVsKTtcbn07XG5cbkJsb2cucHJvdG90eXBlLmZldGNoQmxvZyA9IGZ1bmN0aW9uKGRhdGUpIHtcbiAgY29uc29sZS5sb2coZGF0ZSk7XG59OyIsIi8vIGluc3RhbnRpYXRlIE1lZGlhdG9yIGhlcmUsICogc2luZ2xldG9uICpcbm1vZHVsZS5leHBvcnRzID0gbmV3IE1lZGlhdG9yKCk7XG5cbmZ1bmN0aW9uIE1lZGlhdG9yKCkge1xuICB0aGlzLmV2ZW50cyA9IHt9O1xuICByZXR1cm4gdGhpcztcbn1cblxuTWVkaWF0b3IucHJvdG90eXBlLnB1Ymxpc2ggPSBmdW5jdGlvbihtc2csIGRhdGEpIHtcbiAgaWYgKHRoaXMuZXZlbnRzW21zZ10pIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuZXZlbnRzW21zZ10ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB0aGlzLmV2ZW50c1ttc2ddW2ldKGRhdGEpO1xuICAgIH1cbiAgfVxufTtcblxuTWVkaWF0b3IucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uKG1zZywgZikge1xuICBpZiAoIXRoaXMuZXZlbnRzW21zZ10pIHtcbiAgICB0aGlzLmV2ZW50c1ttc2ddID0gW107XG4gIH1cblxuICB0aGlzLmV2ZW50c1ttc2ddLnB1c2goZik7XG59O1xuIiwiXG5cbm1vZHVsZS5leHBvcnRzID0gTW9ja0FqYXg7XG5cbmZ1bmN0aW9uIE1vY2tBamF4KG9wdHMpIHtcbiAgdGhpcy5vcHRzID0gb3B0cztcbiAgdGhpcy5yZXNwb25zZSA9IG51bGw7XG4gIHRoaXMuZG9uZVByb21pc2UgPSBudWxsO1xuICB0aGlzLmZhaWxQcm9taXNlID0gbnVsbDtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBqc29uU3RyaW5nID0gXCJcIjtcblxuICAvLyB0aGlzIHBhcnQgaXMganVzdCB0byBicmluZyBpbiBtb2NrIGRhdGEgZGVwZW5kaW5nIG9uIHRoZSByZXF1ZXN0XG4gIGlmICh0aGlzLm9wdHMuZGF0YS5tZXRob2QgPT0gJ2ZldGNoT3B0aW9ucycpIHtcbiAgICBqc29uU3RyaW5nID0gXCJbXFxuICBcXFwiSnVuZSAyMDE1XFxcIixcXG4gIFxcXCJNYXkgMjAxNVxcXCIsXFxuICBcXFwiQXByaWwgMjAxNVxcXCIsXFxuICBcXFwiTWFyY2ggMjAxNVxcXCIsXFxuICBcXFwiRmVicnVhcnkgMjAxNVxcXCIsXFxuICBcXFwiSmFudWFyeSAyMDE1XFxcIlxcbl1cIjtcbiAgfVxuXG4gIHRoaXMucmVzcG9uc2UgPSBKU09OLnBhcnNlKGpzb25TdHJpbmcpO1xuICBcbiAgLy8gc2V0IHRpbWVyIHRvIHJ1biB0aGlzLmRvbmVQcm9taXNlIGFmdGVyIHNvbWUgdGltZW91dCwgc2ltdWxhdGUgYSBuZXR3b3JrIGRlbGF5XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgaWYgKHNlbGYuZG9uZVByb21pc2UpIHtcbiAgICAgIHNlbGYuZG9uZVByb21pc2Uoc2VsZi5yZXNwb25zZSk7XG4gICAgfVxuICB9LCAxMDApO1xuXG4gIHJldHVybiB0aGlzO1xufVxuXG5Nb2NrQWpheC5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uKGYpIHtcbiAgdGhpcy5kb25lUHJvbWlzZSA9IGY7XG59O1xuXG5Nb2NrQWpheC5wcm90b3R5cGUuZmFpbCA9IGZ1bmN0aW9uKGYpIHtcbiAgdGhpcy5mYWlsUHJvbWlzZSA9IGY7XG59OyIsIlxudmFyIG1lZGlhdG9yID0gcmVxdWlyZSgnLi4vbWVkaWF0b3IvbWVkaWF0b3InKTtcbnZhciBNb2NrQWpheCA9IHJlcXVpcmUoJy4uL21vY2tfYWpheC9tb2NrX2FqYXgnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaWRlYmFyO1xuXG5mdW5jdGlvbiBTaWRlYmFyKG9wdHMpIHtcbiAgdmFyIGh0bWwgPSBcIjxkaXYgY2xhc3M9XFxcInNpZGViYXJcXFwiPlxcbiAgIDx1bD48L3VsPlxcbiAgIDxocj5cXG48L2Rpdj5cXG5cIjtcbiAgdGhpcy4kZWwgPSAkKGh0bWwpO1xuICB0aGlzLmVsZW1lbnRzVGVtcGxhdGUgPSBfLnRlbXBsYXRlKFwiPCUgXy5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihlbCwgaSkgeyAlPlxcbiAgPGxpPCU9IGkgPT0gMCA/ICcgY2xhc3M9XFxcImFjdGl2ZVxcXCInIDogJycgJT4+XFxuICAgIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6IHZvaWQoMCk7XFxcIj48JT0gZWwgJT48L2E+XFxuICA8L2xpPlxcbjwlIH0pOyAlPlxcblxcbjxsaT5cXG4gIDxhIGhyZWY9XFxcImphdmFzY3JpcHQ6IHZvaWQoMCk7XFxcIj5cXG4gICAgPHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24gZ2x5cGhpY29uIGdseXBoaWNvbi1vcHRpb24taG9yaXpvbnRhbFxcXCI+PC9zcGFuPlxcbiAgPC9hPlxcbjwvbGk+XFxuXCIpO1xuICB0aGlzLnVybCA9IG9wdHMudXJsO1xuXG4gIHZhciBzZWxmID0gdGhpcztcblxuICBtZWRpYXRvci5zdWJzY3JpYmUoJ3BhZ2UtaW5pdCcsIGZ1bmN0aW9uKCkgeyAgXG4gICAgc2VsZi5mZXRjaE9wdGlvbnMoKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cblNpZGViYXIucHJvdG90eXBlLmFwcGVuZFRvID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICQodGFyZ2V0KS5hcHBlbmQodGhpcy4kZWwpO1xufTtcblxuU2lkZWJhci5wcm90b3R5cGUuZmV0Y2hPcHRpb25zID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvLyB1c2UgYSBjdXN0b20gbW9jayBhamF4IG9iamVjdCwgbG9va3MgbGlrZSAkLmFqYXggc28gZWFzeSB0byBwbHVnaW4gdG8gcmVhbCBsaWJyYXJ5IGxhdGVyXG4gIHZhciByZXF1ZXN0ID0gbmV3IE1vY2tBamF4KHtcbiAgICB0eXBlOiAnZ2V0JyxcbiAgICB1cmw6IHRoaXMudXJsLFxuICAgIGRhdGE6IHsgbWV0aG9kOiAnZmV0Y2hPcHRpb25zJyB9LFxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgfSk7XG5cbiAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgc2VsZi5pbnNlcnRPcHRpb25zKHJlc3BvbnNlKTtcbiAgICBtZWRpYXRvci5wdWJsaXNoKCdvcHRpb24tc2VsZWN0ZWQnLCB7IGRhdGU6IHJlc3BvbnNlWzBdIH0pO1xuICB9KTtcblxuICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBjb25zb2xlLmxvZygnZXJyb3InKTtcbiAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gIH0pO1xufTtcblxuU2lkZWJhci5wcm90b3R5cGUuaW5zZXJ0T3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyICR1bCA9IHRoaXMuJGVsLmZpbmQoJ3VsJyk7XG4gICR1bC5hcHBlbmQodGhpcy5lbGVtZW50c1RlbXBsYXRlKHsgZWxlbWVudHM6IG9wdGlvbnMgfSkpO1xuXG4gIHZhciBzZWxmID0gdGhpcztcblxuICAkdWwuZmluZCgnYScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgc2VsZi4kZWwuZmluZCgnbGkuYWN0aXZlJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICR0aGlzLnBhcmVudCgpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICBtZWRpYXRvci5wdWJsaXNoKCdvcHRpb24tc2VsZWN0ZWQnLCB7IGRhdGU6ICR0aGlzLnRleHQoKSB9KTtcbiAgfSk7XG59OyJdfQ==
