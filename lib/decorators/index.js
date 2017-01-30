var logging = require('../logging'),
    authorize = require('../authorize'),
    Conf = require('../conf');

var boundLogger = logging.getRootLogger('decorators.index');

function BlobViewDecorator(page, blobFileName, pathFileName) {
  page.securityRouter.get(pathFileName, authorize({permission: 'view'}));
  page.viewRouter.get(pathFileName, function(req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    req.blobstores.fetchBlob(req.ctx, blobstore, req.entity.path().toDottedPath(), blobFileName, req.entity._revisionId, function(err, path) {
      res.redirect(307, path);
    });
  });
}

exports.BlobViewDecorator = BlobViewDecorator;
