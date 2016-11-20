var GalleryGrid = require('gallerygrid');
var imagesLoaded = require('imagesloaded');

var elem = document.querySelector('.justified-grid');
var gallerygrid = new GalleryGrid(elem,
  {border: 0,
  // ideal pixel height that a row in the layout should have
    targetHeight: 250,
  // minimum container width at which the layout will be applied (useful to apply a responsive alternative layout [e.g. pure CSS] to extremely small screen sizes)
    minWidth: 0,
  // automatically update the layout when the window size changes.
    updateOnResize: true
  });

gallerygrid.apply();

// selector string
imagesLoaded(elem , function() {
  gallerygrid.update(true);
});
