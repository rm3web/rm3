var faker = require('faker');
var getSlug = require('speakingurl');
var entity = require('../../lib/entity');
var update = require('../../lib/update');
var db = require('../../lib/db');

function toSlug(url) {
  return getSlug(url, {
    separator: '_',
    truncate: -48,
    custom: {
      '-': '_'
    }
  });
}

function makeFakeEntity(pth, next) {
  var ent = new entity.Entity();
  var title = faker.lorem.words(3);
  var path = pth.down(toSlug(title));
  var now = faker.date.recent(100);
  var text = faker.lorem.paragraphs(10,'<br />');

  ent.createNew(path, 'base', now);
  ent.summary.title = title;
  ent.summary.abstract = faker.lorem.paragraph(4);

  ent.data.posting = {source: text, format: 'html', htmlslabs: [text]};

  update.createEntity(db, {}, {context: 'ROOT'}, ent, true, 'fake data', next);
}

exports.makeFakeEntity = makeFakeEntity;
