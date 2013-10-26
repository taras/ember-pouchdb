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
  var result = EPDB.initializer(expected);
  equal(result.name, "Secondary");
  equal(result.dbName, "some-app");
  equal(result.types, expected.types);
  equal(Em.typeOf(result.initialize), 'function');
});

module("Additional Initializer", {
  setup: function(){
    App = startApp({}, [
      EPDB.initializer(),    
      EPDB.initializer({
        name:       "Blog PouchDB",
        propName:   "blog",
        dbName:     "testing-blog",
        fullName:   "pouch:blog"
      })
    ]);
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
    start();
  });

  var blog = App.__container__.lookup('pouch:blog');
  equal(Em.typeOf(blog), 'instance');
  equal(blog.get('dbName'), 'testing-blog');
  blog.getDB().then(function(db){
    ok(db);
    start();
  });

});