exports.scaleBestFit = function(width, height, maxSize) {
  var longAxis = Math.max(width, height);
  var scaleFactor =  maxSize / longAxis;
  var newWidth = maxSize;
  var newHeight = maxSize;
  if (width !== longAxis) {
    newWidth = Math.floor(scaleFactor * width);
  }
  if (height !== longAxis) {
    newHeight = Math.floor(scaleFactor * height);
  }
  return {width: newWidth, height: newHeight, scaleFactor: scaleFactor};
};