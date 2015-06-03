(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var mediator = require('./modules/mediator/mediator');
var Sidebar = require('./modules/sidebar/sidebar');

var applicationStart = function() {
	// setup initial page skeleton
	var html = "<h1>Blog</h1>\n<div id=\"sidebar-container\"></div>\n";
	$('#main-page-content').html(html);

	// instantiate modules
	var sidebar = new Sidebar();

	// display the modules
	sidebar.appendTo('#sidebar-container');

	mediator.publish('page-init', {});
};

$(document).ready(applicationStart);
},{"./modules/mediator/mediator":2,"./modules/sidebar/sidebar":3}],2:[function(require,module,exports){
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

var mediator = require('../mediator/mediator');

module.exports = Sidebar;

function Sidebar() {
	var html = "<p>sidebar</p>";
	this.$el = $(html);

	return this;
}

Sidebar.prototype.appendTo = function(target) {
	$(target).append(this.$el);
};

},{"../mediator/mediator":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc3JjL21haW4uanMiLCJhcHAvc3JjL21vZHVsZXMvbWVkaWF0b3IvbWVkaWF0b3IuanMiLCJhcHAvc3JjL21vZHVsZXMvc2lkZWJhci9zaWRlYmFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG52YXIgbWVkaWF0b3IgPSByZXF1aXJlKCcuL21vZHVsZXMvbWVkaWF0b3IvbWVkaWF0b3InKTtcbnZhciBTaWRlYmFyID0gcmVxdWlyZSgnLi9tb2R1bGVzL3NpZGViYXIvc2lkZWJhcicpO1xuXG52YXIgYXBwbGljYXRpb25TdGFydCA9IGZ1bmN0aW9uKCkge1xuXHQvLyBzZXR1cCBpbml0aWFsIHBhZ2Ugc2tlbGV0b25cblx0dmFyIGh0bWwgPSBcIjxoMT5CbG9nPC9oMT5cXG48ZGl2IGlkPVxcXCJzaWRlYmFyLWNvbnRhaW5lclxcXCI+PC9kaXY+XFxuXCI7XG5cdCQoJyNtYWluLXBhZ2UtY29udGVudCcpLmh0bWwoaHRtbCk7XG5cblx0Ly8gaW5zdGFudGlhdGUgbW9kdWxlc1xuXHR2YXIgc2lkZWJhciA9IG5ldyBTaWRlYmFyKCk7XG5cblx0Ly8gZGlzcGxheSB0aGUgbW9kdWxlc1xuXHRzaWRlYmFyLmFwcGVuZFRvKCcjc2lkZWJhci1jb250YWluZXInKTtcblxuXHRtZWRpYXRvci5wdWJsaXNoKCdwYWdlLWluaXQnLCB7fSk7XG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeShhcHBsaWNhdGlvblN0YXJ0KTsiLCIvLyBpbnN0YW50aWF0ZSBNZWRpYXRvciBoZXJlLCAqIHNpbmdsZXRvbiAqXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBNZWRpYXRvcigpO1xuXG5mdW5jdGlvbiBNZWRpYXRvcigpIHtcblx0dGhpcy5ldmVudHMgPSB7fTtcblx0cmV0dXJuIHRoaXM7XG59XG5cbk1lZGlhdG9yLnByb3RvdHlwZS5wdWJsaXNoID0gZnVuY3Rpb24obXNnLCBkYXRhKSB7XG5cdGlmICh0aGlzLmV2ZW50c1ttc2ddKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmV2ZW50c1ttc2ddLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdFx0dGhpcy5ldmVudHNbbXNnXVtpXShkYXRhKTtcblx0XHR9XG5cdH1cbn07XG5cbk1lZGlhdG9yLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbihtc2csIGYpIHtcblx0aWYgKCF0aGlzLmV2ZW50c1ttc2ddKSB7XG5cdFx0dGhpcy5ldmVudHNbbXNnXSA9IFtdO1xuXHR9XG5cblx0dGhpcy5ldmVudHNbbXNnXS5wdXNoKGYpO1xufTtcbiIsIlxudmFyIG1lZGlhdG9yID0gcmVxdWlyZSgnLi4vbWVkaWF0b3IvbWVkaWF0b3InKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaWRlYmFyO1xuXG5mdW5jdGlvbiBTaWRlYmFyKCkge1xuXHR2YXIgaHRtbCA9IFwiPHA+c2lkZWJhcjwvcD5cIjtcblx0dGhpcy4kZWwgPSAkKGh0bWwpO1xuXG5cdHJldHVybiB0aGlzO1xufVxuXG5TaWRlYmFyLnByb3RvdHlwZS5hcHBlbmRUbyA9IGZ1bmN0aW9uKHRhcmdldCkge1xuXHQkKHRhcmdldCkuYXBwZW5kKHRoaXMuJGVsKTtcbn07XG4iXX0=
