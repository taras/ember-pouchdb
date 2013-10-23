/* global EPDB */

var db, photo, shoes, boots, photograph, module = QUnit.module;

var mock = {
    shoes: {
      title: "Landing Gear",
      description: "Gives you soft landing",
      tags: [ 'hello', 'world' ],
      category: 'Shoes'
    },
    boots: {
      title: "Spaceboots",
      description: "Make you light on your feet.",
      tags: [ 'bye', 'earth' ],
      category: 'Boots'
    },
    photograph: {
      title: "Photo from space",
      description: "Its beautiful up there",
      tags: [ 'earth', 'water' ]
    }
  };

var Photo = EPDB.Model.extend({
  title: null,
  description: null,
  image: null,
  tags: [],
  serialize: function(){
    return this.getProperties(['title', 'description', 'image', 'tags']);
  }
});

var Product = EPDB.Model.extend({
  title: null,
  description: null,
  category: null,
  tags: [],
  thumbnail: null,
  serialize: function() {
    return this.getProperties(['title','description','category','tags','thumbnail']);
  }
});

module('Unit - Storage Operations', {
  setup: function() {
    Ember.run(function(){
      db = EPDB.Storage.create({
        dbName: 'testing-main',
        docTypes: {
          product: Product,
          photo: Photo
        }
      });

      shoes = Product.create(mock.shoes);
      boots = Product.create(mock.boots);
      photograph = Photo.create(mock.photograph);
    });
  },
  teardown: function() {
    Ember.run(function(){
      db.remove();
      db.destroy();
    });
  }
});

asyncTest("POST & GET", function(){
  expect(6);

  Em.RSVP.all(
    [ 
      db.POST(shoes), 
      db.POST(boots),
      db.POST(photograph)
    ]
  ).then(function(result){
    photo = result[2];
    equal(Em.typeOf(photo), 'instance');
    ok(photo.get('id'));
    return db.GET(photo.get('id'));
  }).then(function(model){
    equal(Em.typeOf(model), 'instance');
    equal(model.constructor, Photo);
    equal(photo.get('title'), model.get('title'));
  }).then(function(result){
    ok(true);
    start();
  }, function(error){
    QUnit.log(error);
    ok(false);
    start();
  });
});

asyncTest("PUT", function(){
  expect(5);

  var new_title = "Chrystal heels";
  var original_rev = null;

  Em.RSVP.all(
    [ 
      db.POST(shoes), 
      db.POST(boots),
      db.POST(photograph)
    ]
  ).then(function(result){
    shoes = result[0];
    shoes.set('title', new_title);
    original_rev = shoes.get('rev');
    return db.PUT(shoes);
  }).then(function(model){
    equal(Em.typeOf(model), 'instance');
    equal(model.constructor, Product);
    equal(model.get('title'), new_title);
    ok(!Em.isEmpty(model.get('rev')));
    ok(!Em.isEqual(original_rev, model.get('rev')));
    start();
  },function(error){
    QUnit.log(error);
    ok(false);
    start();
  });

});

asyncTest("DELETE", function(){
  expect(1);

  Em.RSVP.all(
    [ 
      db.POST(shoes), 
      db.POST(boots),
      db.POST(photograph)
    ]
  ).then(function(result){
    photo = result[2];
    return db.DELETE(photo);
  }).then(function(){
    return db.GET(photo.get('id'));
  }).then(function(result){
    ok(false);
    start();
  }, function(error){
    ok(true);
    start();
  });

});

asyncTest("findAll", function(){
  expect(2);

  Em.RSVP.all(
    [ 
      db.POST(shoes), 
      db.POST(boots),
      db.POST(photograph)
    ]
  ).then(function(result){
    return db.findAll('product');
  }).then(function(models){
    equal(models.length, 2);
    ok(true);
    start();
  }, function(error){
    console.log(error);
    ok(false);
    start();
  });

});
