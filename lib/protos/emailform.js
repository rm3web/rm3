var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var EmailForm = require('../forms/email.js');
var update = require ('../update'),
    validator = require('validator'),
    toSlug = require('../toslug'),
    authorize = require('../authorize'),
    csurf = require('csurf'),
    formlib = require('../formlib'),
    sanitize = require('../sanitize'),
    logging = require('../logging'),
    Conf = require('../conf'),
    errs = require('errs');
var nodemailer = require('nodemailer');
var boundLogger = logging.getRootLogger('mixins.index');

var csrfProtection = csurf();

function EmailError() {
  this.message = "Error in sending email";
}
util.inherits(EmailError, Error);
errs.register('email.error', EmailError);

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport(Conf.getEndpoint('email'));

function EmailFormPage() {
  Page.call(this);
  this.proto = 'emailform';
  this.editTemplate = 'edit';
  this.createTemplate = 'edit';

  this.preCreate = function preCreate(entity) {
    entity.fullTextString = entity.summary.abstract;
  };

  this.createFunc = function(now, req, res, next) {
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    if (validator.toBoolean(req.body.autogenSlug)) {
      var slug = toSlug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
    }
    formlib.copyViaDottedPath(req.entity, req.body, EmailForm.entityToForm);
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, req.body.memo,
    function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      } else {
        return res.redirect(req.site.sitePathToUrl(req.entity.path()));
      }
    });
  };

  this.editFunc = function(oldent, now, req, res, next) {
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    var minorChange = validator.toBoolean(req.body.minorChange);
    var sameRevision = false;
    if (req.entity.curLogRev) {
      var isDraft = !req.entity.curLogRev.evtFinal;
      if (isDraft && saveAsDraft) {
        sameRevision = !validator.toBoolean(req.body.createNewDraft);
      }
    }
    formlib.copyViaDottedPath(req.entity, req.body, EmailForm.entityToForm);
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    if (minorChange) {
      req.entity.updateTouched(now);
    } else {
      req.entity.updateTimes(now);
    }
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, sameRevision, req.body.memo, next);
  };

  this.exposeFunc = function(editData, req, res, next) {
    formlib.copyViaDottedPath(editData, req.entity, EmailForm.formToEntity);
    res.serverVars.bundle = "bundles/email.js";
    res.serverVars.component = "email.jsx";
    res.serverVars.formData = editData;
    next(null, editData);
  };

  this.exposeCreateFunc = function(editData, req, res, next) {
    res.serverVars.bundle = "bundles/email.js";
    res.serverVars.component = "email.jsx";
    return next(null, editData);
  };

  this.validateForm = function(update, body, next) {
    var emailForm = new EmailForm(update);
    emailForm.checkForm(body, next);
  };

  this.securityRouter.get('email.js', authorize({effectivePermission: 'view'}));

  this.freshnessRouter.get('email.js', view.noCacheView);

  this.commandRouter.get('email.js', function(req, res, next) {
    return req.rateLimiter.csrfEmailLimiter(req.ipAddress, req, res, next);
  });

  this.viewRouter.get('email.js', csrfProtection);
  this.viewRouter.get('email.js', function(req, res, next) {
    res.format({
      'text/javascript': function() {
        res.write('(function (root) {root.csrfToken = "' +
          req.csrfToken() + '";root.commentPath = "' +
          req.site.sitePathToUrl(req.sitepath) + 'email.cgi' +
          '";}(this));');
        res.end();
      }
    });
  });

  this.securityRouter.post('email.cgi', csrfProtection);
  this.securityRouter.post('email.cgi', authorize({effectivePermission: 'view'}));

  this.freshnessRouter.post('email.cgi', view.noCacheView);

  this.commandRouter.post('email.cgi', function(req, res, next) {
    return req.rateLimiter.emailLimiter(req.ipAddress, req, res, next);
  });

  this.commandRouter.post('email.cgi', function(req, res, next) {
    res.format({
      'application/json': function() {
        var now = new Date();

        if (!req.body.comment) {
          return logging.logAndCreateError(boundLogger, 'email.cgi no body',
            'page.validation', {
              ctx: req.ctx,
              msg: "body is required"
            }, next);
        }

        if (!req.body.email) {
          return logging.logAndCreateError(boundLogger, 'email.cgi no email',
            'page.validation', {
              ctx: req.ctx,
              msg: "email is required"
            }, next);
        }

        var mailBody = 'Email sent via rm3 system\n\n';
        mailBody = mailBody + 'Ip: ' + req.ip + '\n';
        mailBody = mailBody + 'Name: ' + req.body.name + '\n';
        mailBody = mailBody + 'Address: ' + req.body.email + '\n';
        mailBody = mailBody + '\n-------------------------------------------------\n';
        mailBody = mailBody + req.body.comment;
        var mailOptions = {
          from: {
            name: req.body.name,
            address: req.body.email
          },
          to: req.entity.data.address,
          subject: 'Mail from ' + req.entity.path().toDottedPath(),
          text: mailBody
        };

        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            req.flash('info', 'Email not sent');
            return logging.logAndWrapError(boundLogger, error,
              'email.cgi no mail send', 'email.error', {
                ctx: req.ctx,
                body: req.body
              }, next);
          } else {
            req.flash('info', 'Email sent');
            boundLogger.info('email sent', {
              ctx: req.ctx
            });
          }
          res.status(202);
          res.json({posted:true});
          return res.end();
        });
      }
    });
  });

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'send-email'));
}

util.inherits(EmailFormPage, Page);

module.exports = EmailFormPage;
