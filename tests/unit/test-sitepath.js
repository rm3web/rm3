var sitepath = require ('../../lib/sitepath');
var test = require('tape');

test('sitepath creation', function (t) {
	t.plan(3);

	var p = new sitepath(['wh', 'hat']);
	var p2 = new sitepath(['bleh','test'],['test']);

	t.deepEqual(p.path,['wh', 'hat']);
	t.deepEqual(p2.path, ['bleh', 'test']);
	t.deepEqual(p2.partial, ['test']);

	t.end();
});

test('sitepath fromDottedPath', function (t) {
	t.plan(2);

	var p = new sitepath();
	var p2 = new sitepath();
	p.fromDottedPath()
	p2.fromDottedPath('wh.bleh');

	t.deepEqual(p.path,[]);
	t.deepEqual(p2.path, ['wh', 'bleh']);

	t.end();
});

test('sitepath jsonSerialize', function(t) {
	t.plan(1);

	var p = new sitepath(['wh', 'hat'],['test']);

	t.deepEqual(p.jsonSerialize(),['wh','hat']);

	t.end();
});

test('sitepath toUrl', function(t) {
	t.plan(2);

	var p = new sitepath(['wh', 'hat']);

	t.deepEqual(p.toUrl('http://www.wirewd.com/'),
		'http://www.wirewd.com/wh/hat');

	t.deepEqual(p.toUrl('http://www.wirewd.com/',1),
		'http://www.wirewd.com/hat');
	t.end();
});


test('sitepath toDottedPath', function(t) {
	t.plan(1);

	var p = new sitepath(['wh', 'hat']);

	t.deepEqual(p.toDottedPath(),
		'wh.hat');

	t.end();
});

test('sitepath up', function(t) {
	t.plan(1);

	var p = new sitepath(['wh', 'hat']);
	var p2 = new sitepath(['wh']);

	t.deepEqual(p.up(),p2);
	t.end();
});

test('sitepath fromUrlSegment', function(t) {
	t.plan(2);

	var p = new sitepath();
	p.fromUrlSegment('/wh/suck');
	t.deepEqual(p.path,['wh','suck']);
	var p2 = new sitepath();
	p2.fromUrlSegment('/wh/suck/');
	t.deepEqual(p2.path,['wh','suck']);

	t.end();
});

test('sitepath fromUrlSegment prefix', function(t) {
	t.plan(1);

	var p = new sitepath();

	p.fromUrlSegment('/suck',['wh']);
	t.deepEqual(p.path,['wh','suck']);

	t.end();
});

test('sitepath fromUrlSegment bad', function(t) {
	t.plan(1);

	var p = new sitepath();

	p.fromUrlSegment('//suck///');
	t.deepEqual(p.path,['suck']);

	t.end();

});

test('sitepath fromUrlSegment path', function(t) {
	t.plan(2);

	var p = new sitepath();

	p.fromUrlSegment('/suck/blah.html');
	t.deepEqual(p.path,['suck']);
	t.deepEqual(p.page,'blah.html');

	t.end();
});

test('sitepath fromUrlSegment partial', function(t) {
	t.plan(6);

	var p = new sitepath();

	p.fromUrlSegment('/suck/$/offset/15');
	t.deepEqual(p.path,['suck']);
	t.deepEqual(p.page,null);
	t.deepEqual(p.partial,'/offset/15');

	p.fromUrlSegment('/suck/blah.txt/$/offset/15');
	t.deepEqual(p.path,['suck']);
	t.deepEqual(p.page,'blah.txt');
	t.deepEqual(p.partial,'/offset/15');
	t.end();
});

test('sitepath fromUrlSegment invalid', function(t) {
	t.plan(1);

	var p = new sitepath();

	t.throws(function() {
		p.fromUrlSegment('/suck/bla-.html');
	}, 'validation error');

	t.end();
});

test('sitepath down', function(t) {
	t.plan(1);

	var p = new sitepath(['wh', 'hat']);
	var p2 = new sitepath(['wh']);

	t.deepEqual(p2.down('hat'),p);
	t.end();
});