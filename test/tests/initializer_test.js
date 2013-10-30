/* global EPDB */

var App, module = QUnit.module;

module("Initializer Customizations");

test("option setting", function(){
  expect(4);
  var expected = {
    name: "Secondary",
    dbName: "some-app",
    types: ['controller']
  };
  var result = EPDB.get_initializer(expected);
  equal(result.name, "Secondary");
  equal(result.dbName, "some-app");
  equal(result.types, expected.types);
  equal(Em.typeOf(result.initialize), 'function');
});

module("Additional Initializer", {
  setup: function(){
    var initializers = [EPDB.get_initializer({
        name:       "Blog PouchDB",
        propName:   "blog",
        dbName:     "testing-blog",
        fullName:   "pouch:blog"
      })];
    App = startApp({}, initializers);
  },
  teardown: function() {
    Ember.run(function(){
      App.__container__.lookup('pouch:main').remove();
      App.__container__.lookup('pouch:blog').remove();
      App.destroy();
    });
  }
});

asyncTest('multiple databases', function() {
  expect(6);

  var main = App.__container__.lookup('pouch:main');
  equal(Em.typeOf(main), 'instance');
  equal(main.get('dbName'), "PouchDB");
  main.getDB().then(function(db){
    ok(db);
  });

  var blog = App.__container__.lookup('pouch:blog');
  equal(Em.typeOf(blog), 'instance');
  equal(blog.get('dbName'), 'testing-blog');
  blog.getDB().then(function(db){
    start();
    ok(db);
  });

});

module("Promise Tracker", {
  setup: function(){
    App = startApp();
  },
  teardown: function() {
    Ember.run(function(){
      App.__container__.lookup('pouch:main').remove();
      App.destroy();
    });
  }
});

asyncTest("is present", function(){
  expect(1);
  var main = App.__container__.lookup('pouch:main');
  start();
  ok(main.tracker);
});