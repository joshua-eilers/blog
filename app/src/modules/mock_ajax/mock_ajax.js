var fs = require('fs');

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
    jsonString = fs.readFileSync(__dirname + '/responses/sidebar_options.json', 'utf8');
  } else if (this.opts.data.method == 'fetchBlog') {
    if (this.opts.data.date == 'June 2015') {
      jsonString = fs.readFileSync(__dirname + '/responses/june_2015.json', 'utf8');
    } else if (this.opts.data.date == 'May 2015') {
      jsonString = fs.readFileSync(__dirname + '/responses/may_2015.json', 'utf8');
    } else if (this.opts.data.date == 'April 2015') {
      jsonString = fs.readFileSync(__dirname + '/responses/april_2015.json', 'utf8');
    } else if (this.opts.data.date == 'March 2015') {
      jsonString = fs.readFileSync(__dirname + '/responses/march_2015.json', 'utf8');
    } else if (this.opts.data.date == 'February 2015') {
      jsonString = fs.readFileSync(__dirname + '/responses/february_2015.json', 'utf8');
    } else if (this.opts.data.date == 'January 2015') {
      jsonString = fs.readFileSync(__dirname + '/responses/january_2015.json', 'utf8');
    }
  } else if (this.opts.data.method == 'fetchComments') {
    jsonString = fs.readFileSync(__dirname + '/responses/comments.json', 'utf8');
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