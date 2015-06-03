(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var mediator = require('./modules/mediator/mediator');
var Sidebar = require('./modules/sidebar/sidebar');

var applicationStart = function() {
  // setup initial page skeleton
  var html = "<div id=\"sidebar-container\" class=\"col-sm-3 col-md-2\"></div>\n<div id=\"blog-content\" class=\"col-sm-9 col-md-10\"></div>\n";
  $('#main-page-content').html(html);

  // instantiate modules
  var sidebar = new Sidebar({ url: null });

  // display the modules
  sidebar.appendTo('#sidebar-container');

  mediator.publish('page-init', {});
};

$(document).ready(applicationStart);
},{"./modules/mediator/mediator":2,"./modules/sidebar/sidebar":4}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){


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
    jsonString = "[\"A\", \"B\", \"C\"]";
    this.response = JSON.parse(jsonString);
  }

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
},{}],4:[function(require,module,exports){

var mediator = require('../mediator/mediator');
var MockAjax = require('../mock_ajax/mock_ajax');

module.exports = Sidebar;

function Sidebar(opts) {
  var html = "<div class=\"sidebar\">\n  <ul></ul>\n</div>";
  this.$el = $(html);
  this.elementsTemplate = _.template("<% _.each(elements, function(el) { %>\n  <li><a href=\"javascript: void(0);\"><%= el %></a></li>\n<% }); %>\n");
  this.url = opts.url;

  var self = this;

  mediator.subscribe('page-init', function() {  
    self.fetchOptions();
  });

  return this;
}

Sidebar.prototype.appendTo = function(target) {
  $(target).append(this.$el);
  this.$el.find('ul').append(this.elementsTemplate({ elements: ['A', 'B', 'C'] }));
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
    console.log(response);
  });

  request.fail(function(response) {
    console.log('error');
    console.log(response);
  });
};

},{"../mediator/mediator":2,"../mock_ajax/mock_ajax":3}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc3JjL21haW4uanMiLCJhcHAvc3JjL21vZHVsZXMvbWVkaWF0b3IvbWVkaWF0b3IuanMiLCJhcHAvc3JjL21vZHVsZXMvbW9ja19hamF4L21vY2tfYWpheC5qcyIsImFwcC9zcmMvbW9kdWxlcy9zaWRlYmFyL3NpZGViYXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG52YXIgbWVkaWF0b3IgPSByZXF1aXJlKCcuL21vZHVsZXMvbWVkaWF0b3IvbWVkaWF0b3InKTtcbnZhciBTaWRlYmFyID0gcmVxdWlyZSgnLi9tb2R1bGVzL3NpZGViYXIvc2lkZWJhcicpO1xuXG52YXIgYXBwbGljYXRpb25TdGFydCA9IGZ1bmN0aW9uKCkge1xuICAvLyBzZXR1cCBpbml0aWFsIHBhZ2Ugc2tlbGV0b25cbiAgdmFyIGh0bWwgPSBcIjxkaXYgaWQ9XFxcInNpZGViYXItY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiY29sLXNtLTMgY29sLW1kLTJcXFwiPjwvZGl2PlxcbjxkaXYgaWQ9XFxcImJsb2ctY29udGVudFxcXCIgY2xhc3M9XFxcImNvbC1zbS05IGNvbC1tZC0xMFxcXCI+PC9kaXY+XFxuXCI7XG4gICQoJyNtYWluLXBhZ2UtY29udGVudCcpLmh0bWwoaHRtbCk7XG5cbiAgLy8gaW5zdGFudGlhdGUgbW9kdWxlc1xuICB2YXIgc2lkZWJhciA9IG5ldyBTaWRlYmFyKHsgdXJsOiBudWxsIH0pO1xuXG4gIC8vIGRpc3BsYXkgdGhlIG1vZHVsZXNcbiAgc2lkZWJhci5hcHBlbmRUbygnI3NpZGViYXItY29udGFpbmVyJyk7XG5cbiAgbWVkaWF0b3IucHVibGlzaCgncGFnZS1pbml0Jywge30pO1xufTtcblxuJChkb2N1bWVudCkucmVhZHkoYXBwbGljYXRpb25TdGFydCk7IiwiLy8gaW5zdGFudGlhdGUgTWVkaWF0b3IgaGVyZSwgKiBzaW5nbGV0b24gKlxubW9kdWxlLmV4cG9ydHMgPSBuZXcgTWVkaWF0b3IoKTtcblxuZnVuY3Rpb24gTWVkaWF0b3IoKSB7XG4gIHRoaXMuZXZlbnRzID0ge307XG4gIHJldHVybiB0aGlzO1xufVxuXG5NZWRpYXRvci5wcm90b3R5cGUucHVibGlzaCA9IGZ1bmN0aW9uKG1zZywgZGF0YSkge1xuICBpZiAodGhpcy5ldmVudHNbbXNnXSkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5ldmVudHNbbXNnXS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHRoaXMuZXZlbnRzW21zZ11baV0oZGF0YSk7XG4gICAgfVxuICB9XG59O1xuXG5NZWRpYXRvci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24obXNnLCBmKSB7XG4gIGlmICghdGhpcy5ldmVudHNbbXNnXSkge1xuICAgIHRoaXMuZXZlbnRzW21zZ10gPSBbXTtcbiAgfVxuXG4gIHRoaXMuZXZlbnRzW21zZ10ucHVzaChmKTtcbn07XG4iLCJcblxubW9kdWxlLmV4cG9ydHMgPSBNb2NrQWpheDtcblxuZnVuY3Rpb24gTW9ja0FqYXgob3B0cykge1xuICB0aGlzLm9wdHMgPSBvcHRzO1xuICB0aGlzLnJlc3BvbnNlID0gbnVsbDtcbiAgdGhpcy5kb25lUHJvbWlzZSA9IG51bGw7XG4gIHRoaXMuZmFpbFByb21pc2UgPSBudWxsO1xuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGpzb25TdHJpbmcgPSBcIlwiO1xuXG4gIC8vIHRoaXMgcGFydCBpcyBqdXN0IHRvIGJyaW5nIGluIG1vY2sgZGF0YSBkZXBlbmRpbmcgb24gdGhlIHJlcXVlc3RcbiAgaWYgKHRoaXMub3B0cy5kYXRhLm1ldGhvZCA9PSAnZmV0Y2hPcHRpb25zJykge1xuICAgIGpzb25TdHJpbmcgPSBcIltcXFwiQVxcXCIsIFxcXCJCXFxcIiwgXFxcIkNcXFwiXVwiO1xuICAgIHRoaXMucmVzcG9uc2UgPSBKU09OLnBhcnNlKGpzb25TdHJpbmcpO1xuICB9XG5cbiAgLy8gc2V0IHRpbWVyIHRvIHJ1biB0aGlzLmRvbmVQcm9taXNlIGFmdGVyIHNvbWUgdGltZW91dCwgc2ltdWxhdGUgYSBuZXR3b3JrIGRlbGF5XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgaWYgKHNlbGYuZG9uZVByb21pc2UpIHtcbiAgICAgIHNlbGYuZG9uZVByb21pc2Uoc2VsZi5yZXNwb25zZSk7XG4gICAgfVxuICB9LCAxMDApO1xuXG4gIHJldHVybiB0aGlzO1xufVxuXG5Nb2NrQWpheC5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uKGYpIHtcbiAgdGhpcy5kb25lUHJvbWlzZSA9IGY7XG59O1xuXG5Nb2NrQWpheC5wcm90b3R5cGUuZmFpbCA9IGZ1bmN0aW9uKGYpIHtcbiAgdGhpcy5mYWlsUHJvbWlzZSA9IGY7XG59OyIsIlxudmFyIG1lZGlhdG9yID0gcmVxdWlyZSgnLi4vbWVkaWF0b3IvbWVkaWF0b3InKTtcbnZhciBNb2NrQWpheCA9IHJlcXVpcmUoJy4uL21vY2tfYWpheC9tb2NrX2FqYXgnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaWRlYmFyO1xuXG5mdW5jdGlvbiBTaWRlYmFyKG9wdHMpIHtcbiAgdmFyIGh0bWwgPSBcIjxkaXYgY2xhc3M9XFxcInNpZGViYXJcXFwiPlxcbiAgPHVsPjwvdWw+XFxuPC9kaXY+XCI7XG4gIHRoaXMuJGVsID0gJChodG1sKTtcbiAgdGhpcy5lbGVtZW50c1RlbXBsYXRlID0gXy50ZW1wbGF0ZShcIjwlIF8uZWFjaChlbGVtZW50cywgZnVuY3Rpb24oZWwpIHsgJT5cXG4gIDxsaT48YSBocmVmPVxcXCJqYXZhc2NyaXB0OiB2b2lkKDApO1xcXCI+PCU9IGVsICU+PC9hPjwvbGk+XFxuPCUgfSk7ICU+XFxuXCIpO1xuICB0aGlzLnVybCA9IG9wdHMudXJsO1xuXG4gIHZhciBzZWxmID0gdGhpcztcblxuICBtZWRpYXRvci5zdWJzY3JpYmUoJ3BhZ2UtaW5pdCcsIGZ1bmN0aW9uKCkgeyAgXG4gICAgc2VsZi5mZXRjaE9wdGlvbnMoKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cblNpZGViYXIucHJvdG90eXBlLmFwcGVuZFRvID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICQodGFyZ2V0KS5hcHBlbmQodGhpcy4kZWwpO1xuICB0aGlzLiRlbC5maW5kKCd1bCcpLmFwcGVuZCh0aGlzLmVsZW1lbnRzVGVtcGxhdGUoeyBlbGVtZW50czogWydBJywgJ0InLCAnQyddIH0pKTtcbn07XG5cblNpZGViYXIucHJvdG90eXBlLmZldGNoT3B0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgLy8gdXNlIGEgY3VzdG9tIG1vY2sgYWpheCBvYmplY3QsIGxvb2tzIGxpa2UgJC5hamF4IHNvIGVhc3kgdG8gcGx1Z2luIHRvIHJlYWwgbGlicmFyeSBsYXRlclxuICB2YXIgcmVxdWVzdCA9IG5ldyBNb2NrQWpheCh7XG4gICAgdHlwZTogJ2dldCcsXG4gICAgdXJsOiB0aGlzLnVybCxcbiAgICBkYXRhOiB7IG1ldGhvZDogJ2ZldGNoT3B0aW9ucycgfSxcbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gIH0pO1xuXG4gIHJlcXVlc3QuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgfSk7XG5cbiAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yJyk7XG4gICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICB9KTtcbn07XG4iXX0=
