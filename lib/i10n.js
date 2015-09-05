var IntlMessageFormat = require('intl-messageformat'),
    createFormatCache = require('intl-format-cache');

var getMessageFormat  = createFormatCache(IntlMessageFormat);

var MESSAGES = {
  ABSTRACT: 'Abstract',
  ADD: 'Add',
  ADD_TAG: 'Add Tag',
  ADD_TO_NAVBAR: 'Add to navbar',
  ADMIN: 'Admin',
  AUTO_GENERATE_SLUG: 'Auto-generate slug',
  BAD_ID_IN_COOKIE: 'Bad ID in cookie',
  CONFIRM_PASSWORD: 'Confirm password',
  CREATE: 'Create',
  CREATE_ARROW: 'Create  \u25BC',
  DELETE: 'Delete',
  DESCRIPTION: 'Description',
  DO_YOU_REALLY_WANT_TO_GO_HERE: 'Do you really want to go here?',
  EDIT: 'Edit',
  EMAIL: 'Email',
  ERROR: 'Error',
  EVENT_TYPE: 'Event Type',
  FIELD_EMPTY: 'Field Empty',
  FORBIDDEN: 'Forbidden',
  FULL_NAME: 'Full name',
  HISTORY: 'History',
  HTML: 'HTML',
  LAST_UPDATED: 'Last updated',
  LOGIN_ASCII_TEXT_NOSPACES: 'Login (ASCII text, no spaces)',
  MARKDOWN: 'Markdown',
  NAVBAR: 'Navbar',
  MOVE: 'Move',
  NO_VIEW_FOUND_FOR_THAT_URL: 'No view found for that URL',
  NOT_FOUND: 'Not Found',
  OBJECT: 'Object',
  PASSWORD: 'Password',
  PASSWORD_ENTER_TWICE: 'Password (Enter twice)',
  PASSWORD_VALIDATION_FAILED: 'Password validation failed',
  PATH: 'Path',
  POSTED: 'Posted',
  POSTING: 'Posting',
  PREDICATE: 'Predicate',
  PROFILE_TEXT: 'Profile Text',
  PROFILE_URL: 'Profile URL',
  PUBLISH_SILENTLY: 'Publish silently',
  REVISION_ID: 'Revision Id',
  REVISION_NUM: 'Revision Num',
  SAVE_AS_DRAFT: 'Save as draft',
  SUBMIT: 'Submit',
  TAG: 'Tag',
  THIS_ACTION_IS_NOT_PERMITTED: 'This action is not permitted',
  TIME: 'Time',
  TITLE: 'Title',
  URL: 'URL',
  USER: 'User',
  USERNAME: 'Username',
  VALIDATION_ERROR: 'Validation Error',
  YOU_HAVE_BEEN_LOGGED_IN: 'You have been logged in'
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
