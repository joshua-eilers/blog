var fs = require('fs');
var mediator = require('./modules/mediator/mediator');
var overlay = require('./modules/overlay/overlay');
var Sidebar = require('./modules/sidebar/sidebar');
var Blog = require('./modules/blog/blog');

var applicationStart = function() {
  // setup initial page skeleton
  var html = fs.readFileSync(__dirname + '/layout.html', 'utf8');
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