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