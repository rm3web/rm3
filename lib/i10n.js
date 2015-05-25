var IntlMessageFormat = require('intl-messageformat'),
    createFormatCache = require('intl-format-cache');

var getMessageFormat  = createFormatCache(IntlMessageFormat);

var MESSAGES = {
  PASSWORD_VALIDATION_FAILED: 'Password validation failed',
  THIS_ACTION_IS_NOT_PERMITTED: 'This action is not permitted',
  YOU_HAVE_BEEN_LOGGED_IN: 'You have been logged in',
  FIELD_EMPTY: 'Field Empty',
  NUM_PHOTOS: 'You have {numPhotos, plural, ' +
   '=0 {no photos.}' +
   '=1 {one photo.}' +
   'other {# photos.}}',
  USERNAME: 'Username',
  PASSWORD: 'Password',
  SUBMIT: 'Submit',
  BAD_ID_IN_COOKIE: 'Bad ID in cookie',
  VALIDATION_ERROR: 'Validation Error'
};

function getIntl() {
  return {
    locales: 'en-US',
    messages: MESSAGES
  };
}

function formatMessage(message, data) {
  var format = getMessageFormat(MESSAGES[message], 'en-US');
  return format.format(data);
}

function intlErrorMixin(destObject) {
  destObject.prototype.getMessage = function() {
    return formatMessage(this.message, this);
  };
}

exports.formatMessage = formatMessage;
exports.getIntl = getIntl;
exports.intlErrorMixin = intlErrorMixin;