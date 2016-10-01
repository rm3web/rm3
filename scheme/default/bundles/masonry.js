var Masonry = require('masonry-layout');
var imagesLoaded = require('imagesloaded');

var msnry = new Masonry( '.masonry-grid', 
  { "itemSelector": ".hentry-grid", "columnWidth": 200 });

// selector string
imagesLoaded( '#container', function() {
  msnry.layout();
});