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
  CURRENT_PASSWORD: 'Current password',
  CREATE: 'Create',
  CREATE_NEW_DRAFT: 'Create new draft',
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
  EXCLUDE_CHILDREN_DISPLAY: 'Exclude children display',
  FIELD_EMPTY: 'Field Empty',
  GEAR: 'Gear',
  GONE: 'Gone',
  FACETED_BY_TAG: 'Faceted by tag',
  FACETED_BY_MONTH: 'Faceted by month',
  FORBIDDEN: 'Forbidden',
  FULL_NAME: 'Full name',
  HIDDEN: 'Hidden',
  HISTORY: 'History',
  HTML: 'HTML',
  LAST_UPDATED: 'Last updated',
  LOGIN: 'Login',
  LOGIN_ASCII_TEXT_NOSPACES: 'Login (ASCII text, no spaces)',
  LOGOUT: 'Logout',
  MARKDOWN: 'Markdown',
  NAVBAR: 'Navbar',
  MEMO: 'Memo (Briefly describe your changes)',
  MINOR_CHANGE: 'Minor change (don\'t change the last updated time)',
  MODERATE: 'Moderate',
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
  PROTO_AUDIO: 'Audio',
  PROTO_BASE: 'Default Node',
  PROTO_BLOG: 'Blog',
  PROTO_BLOG_SIDEBAR: 'Blog with Sidebar',
  PROTO_COMMENT: 'Comment',
  PROTO_EMAILFORM: 'Email Form',
  PROTO_INDEX: 'Index',
  PROTO_LINK: 'Link',
  PROTO_META: 'Metadata Index',
  PROTO_PHOTO: 'Photo',
  PROTO_PREDICATE: 'Predicate',
  PROTO_USER: 'User',
  PROTO_VECTORGRAPHIC: 'Vector Graphic',
  PUBLISH: 'Publish',
  PUBLISH_SILENTLY: 'Publish silently',
  RATE_LIMITED: 'You have been rate limited',
  REVERT_CHANGES: 'Revert Changes',
  REVISION_ID: 'Revision Id',
  REVISION_NUM: 'Revision Num',
  SAVE: 'Save',
  SAVE_AS_DRAFT: 'Save as draft',
  SEARCH: 'Search',
  SELECT_A_PREDICATE:'Select a predicate',
  SUBMIT: 'Submit',
  TAG: 'Tag',
  THIS_ACTION_IS_NOT_PERMITTED: 'This action is not permitted',
  TIME: 'Time',
  TITLE: 'Title',
  TOTP_ADDED: 'Two Factor Authentication has been added to your account',
  TOTP_ENROLL_FAILED: 'Two Factor Authentication has not been added.  Did you mistype the token?',
  TREE: 'Tree view',
  URL: 'URL',
  URI: 'URI',
  USER: 'User',
  USERNAME: 'Username',
  VALIDATION_ERROR: 'Validation Error',
  VERIFICATION_TOKEN: 'Verification Token',
  YOU_ARE_EDITING_AN_OLD_REV: 'You are editing based on an old revision.  Saving will overwrite any interevening changes.',
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

function addIntlMessage(key, messages) {
  MESSAGES[key] = messages['en-US'];
}

exports.formatMessage = formatMessage;
exports.getIntl = getIntl;
exports.intlErrorMixin = intlErrorMixin;
exports.addIntlMessage = addIntlMessage;
