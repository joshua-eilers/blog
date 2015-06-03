var fs = require('fs');
var mediator = require('./modules/mediator/mediator');
var Sidebar = require('./modules/sidebar/sidebar');

var applicationStart = function() {
  // setup initial page skeleton
  var html = fs.readFileSync(__dirname + '/layout.html', 'utf8');
  $('#main-page-content').html(html);

  // instantiate modules
  var sidebar = new Sidebar({ url: null });

  // display the modules
  sidebar.appendTo('#sidebar-container');

  mediator.publish('page-init', {});
};

$(document).ready(applicationStart);