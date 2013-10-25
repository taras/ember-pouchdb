# PouchDB Wrapper for Ember.js

This library adds *promises* to [PouchDB](http://pouchdb.com/) API to make PouchDB easier to use with Ember.js.

PouchDB is a CouchDB inspired database designed for the browser.  It uses IndexedDB in Firefox and Chrome, WebSQL in Safari and Opera and LevelDB in Node.js.

It is currently tested in:

* Firefox 12+
* Chrome 19+
* Opera 12+
* Safari 5+
* Internet Explorer 10+
* Node.js 0.10+
* Apache Cordova

**Note**: This library is currently only tested in Chrome. Submit an issue if you find problems with other PouchDB compatible environments.

## Getting Started


### Download

This library requires PouchDB library to be included in the page before this library.

**PouchDB Nightly**

* [Debug](http://download.pouchdb.com/pouchdb-nightly.js)
* [Minified](http://download.pouchdb.com/pouchdb-nightly.min.js)
* [AMD](http://download.pouchdb.com/pouchdb.amd-nightly.js)

**Ember PouchDB**

* [Debug](https://raw.github.com/taras/ember-pouchdb/master/dist/ember-pouchdb.js)
* [Minified](https://raw.github.com/taras/ember-pouchdb/master/dist/ember-pouchdb.min.js)
* [AMD](https://raw.github.com/taras/ember-pouchdb/master/dist/ember-pouchdb.amd.js)

```html
<script src="http://download.pouchdb.com/pouchdb-nightly.js"></script>
<script src="https://raw.github.com/taras/ember-pouchdb/master/dist/ember-pouchdb.js"></script>
```

#### with Bower

```bower install ember-pouchdb --save```

```html
<script src="bower_components/pouchdb-nightly.js/index.js"></script>
<script src="bower_components/ember-pouchdb/dist/ember-pouchdb.js"></script>
```

## Usage

You can use the API via an app instance or dependancy injection.

### App instance Example

Use this method if you're not using [Ember App Kit](https://github.com/stefanpenner/ember-app-kit) or ES6 Modules.
```javascript
var App = Ember.Application.create();

// Create a model
App.Photo = EPDB.Model.extend({
	// serialize method returns an object that's stored in the database
	serialize: function(){
		return this.getProperties(['name','description','image']);
	}
});

// Create an instance that you'll use to perform operations
App.pouch = EPDB.Storage.create({
	dbName: "your-app",
	docTypes: {
		photo: App.Photo
	}
});

App.Router.map(function(){
	this.route('photos');
	this.route('photo', {path:'photo/:id'});
});

App.PhotosRoute = Ember.Route.extend({
	model: function() {
		return App.pouch.findAll('photo');
	}
});

App.PhotoRoute = Ember.Route.extend({
	model: function(params) {
		return App.pouch.GET('photo', params.id);
	}
});
```

### Dependancy Injection

Use this method with [Ember App Kit](https://github.com/stefanpenner/ember-app-kit) or ES6 Modules.

**app/app.js**
```javascript
import pouchdb_initializer from 'ember-pouchdb/initializer';
import Photo from 'appkit/models/photo';
import routes from 'appkit/routes;

var App = Ember.Application.create();

App.initializer(pouchdb_initializer({
	docTypes: {
		photo: App.PhotoModel
	}
}));

App.Router.map(routes);

export default App;
```

**app/routes.js**
```javascript
var routes = function() {
	this.route('photos');
	this.route('photo', {path:'photo/:id'});
}

export default routes;
```

**app/models/photo.js**
```
import Model from 'ember-pouchdb/model';

var Photo = Model.extend({
	serialize: function(){
		return this.getProperties(['name', 'description', 'image']);
	}
});

export default Photo;
```

**app/routes/photos.js**
```javascript
var PhotosRoute = Ember.Route.extend({
	model: function() {
		return this.pouch.findAll('photo');
	}
});

export default PhotosRoute;
```

**app/routes/photo.js**
```javascript
var PhotoRoute = Ember.Route.extend({
	model: function(params) {
		return this.pouch.GET('photo', params.id);
	}
});

export default PhotoRoute;
```

## API


### EPDB.initializer(options) function

Method that returns an initializer object that can be passed to App.initializer() method.

**docTypes** is the only option that you **must** specify to be able to use this library. **docTypes** tells the Storage class how to idenfify models that you will later pass to perform operations. Its an object with **keys as simple names for the docType** and **class of the Model as value**. 99% of the time, you would want your Model classes to extend from **EPDB.Model** class. 

```javascript
var options = { // Default options that will be returned if you don't pass an empty options object.
	/**
	 * Name of the initializer
	 * @type {String}
	 */
	name: "PouchDB",
	/**
	 * Property that the instance will be injected onto
	 * @type {String}
	 */
	propName: "pouch",
	/**
	 * Name of the database
	 * @type {String}
	 */
	dbName: "PouchDB",
	/**
	 * fullName of the type to register
	 * @link https://github.com/emberjs/ember.js/blob/master/packages/container/lib/main.js#L258
	 * @type {String}
	 */
	fullName: 'pouch:main',
	/**
	 * Types to inject property into
	 * @type {Array}
	 */
	types: [ 'controller', 'route' ],
	/**
	 * Object with docType as key and model class as value
	 * Example:
	 *   {
	 *     'photo': App.PhotoModel,
	 *     'product': App.ProductModel
	 *   }
	 * @type {Object}
	 */
	docTypes: {}
}
```

### EPDB.Model class

This is a very simple Model class.

```javascript
EPDB.Model = Ember.Object.extend( Ember.Copyable, {
  copy: function() {
    var serialized  = this.serialize();
    serialized.id   = this.get('id');
    serialized.rev  = this.get('rev');
    return this.constructor.create(serialized);
  },
  serialize: function() {
    throw new Error(Ember.String.fmt("%@ must implement serialize() method which returns JSON of this model.", [this]));
  }
});
```

Implements [CopyableMixin](http://emberjs.com/api/classes/Ember.Copyable.html) and defines a ```serialize()``` method. **CopyableMixin** provides ```copy()``` method, which returns a new instance of model that's created from the same class with properties taken from ```this.serialize()```.

```serialize()``` method must return an object with properties and values for this object. This method is used to extract values from this object that are stored in the PouchDB database.

### EPDB.Storage class

**EPDB.Storage** class is **the** Ember PouchDB wrapper class. Creating an instance of this class will automatically open a PouchDB database that you can manipulate with the instance of this class.

#### Options

* dbName - required, string to identify this database. It an be a simple string (ie. "my-pouch") or a url of a remote CouchDB database
* docTypes - required, object with simple strings as properties and model classes as values. 

#### Methods

##### EPDB.Storage#GET(id)

Retrieve a document with the provided id and return a promise that will resolve to an instance of a model of the retrieved document.

##### EPDB.Storage#POST(model)

Create a document in the database for the provided model and return a promise that will resolve to a model with **id** and **rev** for the created document.

##### EPDB.Storage#PUT(model)

Update a document in the database for the provided model and return a promise that will resolve to a model with updated **rev**. 

##### EPDB.Storage#DELETE(model)

Delete document for the provided model. It will not destroy the model instance.

##### EPDB.Storage#findAll(docType)

Retrieve from the database all documents of the specified type and return a promise that will resolve with an array of model instances.

##### EPDB.Storage#remove()

Delete the database and return a promise that will resolve after the database was deleted.

## Development

### Installation

1. ```npm install```
2. ```bower install```

### Run Tests

**In terminal**: ```grunt test```

**In browser**: 

1. ```grunt server``` 
2. Go to [http://localhost:8000/test](http://localhost:8000/test)

### Release

```$ grunt release[:patch|minor|major|git]```