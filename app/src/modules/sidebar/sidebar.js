var fs = require('fs');
var mediator = require('../mediator/mediator');

module.exports = Sidebar;

function Sidebar() {
	var html = fs.readFileSync(__dirname + '/sidebar.html', 'utf8');
	this.$el = $(html);

	return this;
}

Sidebar.prototype.appendTo = function(target) {
	$(target).append(this.$el);
};
