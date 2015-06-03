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
