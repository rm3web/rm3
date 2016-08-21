var express = require('express');
var router = express.Router();

// define the home page route
router.get('/', function(req, res) {
  res.send('Online help goes here.');
});

module.exports = router;
