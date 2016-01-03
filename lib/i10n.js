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
  COMMENT: "Comment",
  CONFIRM_PASSWORD: 'Confirm password',
  CREATE: 'Create',
  DELETE: 'Delete',
  DESCRIPTION: 'Description',
  DISABLE_LOGIN: 'Disable login',
  DO_YOU_REALLY_WANT_TO_GO_HERE: 'Do you really want to go here?',
  DRAFTS: 'Drafts',
  EDIT: 'Edit',
  EDIT_REV: 'Edit based on this revision',
  EMAIL: 'Email',
  ERROR: 'Error',
  EVENT_TYPE: 'Event Type',
  FIELD_EMPTY: 'Field Empty',
  GEAR: 'Gear',
  FACETED_BY_MONTH: 'Faceted by month',
  FORBIDDEN: 'Forbidden',
  FULL_NAME: 'Full name',
  HISTORY: 'History',
  HTML: 'HTML',
  LAST_UPDATED: 'Last updated',
  LOGIN: 'Login',
  LOGIN_ASCII_TEXT_NOSPACES: 'Login (ASCII text, no spaces)',
  LOGOUT: 'Logout',
  MARKDOWN: 'Markdown',
  NAVBAR: 'Navbar',
  MOVE: 'Move',
  NO_VIEW_FOUND_FOR_THAT_URL: 'No view found for that URL',
  NOT_FOUND: 'Not Found',
  OBJECT: 'Object',
  PAGINATED: 'Paginated',
  PASSWORD: 'Password',
  PASSWORD_ENTER_TWICE: 'Password (Enter twice)',
  PASSWORD_VALIDATION_FAILED: 'Password validation failed',
  PATH: 'Path',
  POSTED: 'Posted',
  POSTING: 'Posting',
  PREDICATE: 'Predicate',
  PROFILE_TEXT: 'Profile Text',
  PROFILE_URL: 'Profile URL',
  PROTO_BASE: 'Default Node',
  PROTO_COMMENT: 'Comment',
  PROTO_INDEX: 'Index (temp)',
  PROTO_META: 'Metadata Index',
  PROTO_BLOG: 'Blog',
  PROTO_USER: 'User',
  PUBLISH: 'Publish',
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
  YOU_ARE_EDITING_AN_OLD_REV: 'You are editing based on an old revision.  Saving will overwrite any interevening changes.',
  YOU_HAVE_BEEN_LOGGED_IN: 'You have been logged in',
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
