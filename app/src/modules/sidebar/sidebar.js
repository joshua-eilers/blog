var fs = require('fs');
var mediator = require('../mediator/mediator');
var MockAjax = require('../mock_ajax/mock_ajax');

module.exports = Sidebar;

function Sidebar(opts) {
  var html = fs.readFileSync(__dirname + '/sidebar.html', 'utf8');
  this.$el = $(html);
  this.elementsTemplate = _.template(fs.readFileSync(__dirname + '/elements.html', 'utf8'));
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
