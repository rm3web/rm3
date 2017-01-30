var Masonry = require('masonry-layout');
var imagesLoaded = require('imagesloaded');

var elem = document.querySelector('.masonry-grid');
var msnry = new Masonry(elem,
  {"itemSelector": ".hentry-masonry"});

// selector string
imagesLoaded(elem , function() {
  msnry.layout();
});
