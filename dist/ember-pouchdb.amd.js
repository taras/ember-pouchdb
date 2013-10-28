define("ember-pouchdb/get_initializer",
  ["ember-pouchdb/storage","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Storage = __dependency1__.Storage;

    var get_initializer = function(options, initialize) {

      options = Ember.merge({
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
      }, options);

      /**
       * Callback function to initilizer
       * @param  {Application}  application Application instance thats being initalized
       * @param  {Container}    container   Application's container
       * @return {object}             
       */
      if ( typeof initialize === 'undefined' ) {
        initialize = function(container, application) {
          application.register(options.fullName, Storage.extend({
            dbName: application.get('pouch.dbName') || options.dbName,
            docTypes: application.get('pouch.docTypes') || options.docTypes
          }));
          options.types.forEach(function(type){
            application.inject(type, options.propName, options.fullName);
          });
        };    
      }

      options['initialize'] = initialize;

      return options;
    };

    __exports__.get_initializer = get_initializer;
  });
define("ember-pouchdb/model",
  ["exports"],
  function(__exports__) {
    "use strict";
    var Model = Ember.Object.extend( Ember.Copyable, {
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

    __exports__.Model = Model;
  });
define("ember-pouchdb/storage",
  ["ember-pouchdb/model","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Model = __dependency1__.Model;

    var Storage = Ember.Object.extend({
      /**
       * Name of this database
       * @type {string}
       */
      dbName: null,
      /**
       * Object with docType as key and model class as value.
       * TODO: remove this after https://github.com/stefanpenner/ember-app-kit/issues/124 is fixed
       * Example:
       *   {
       *     'photo': App.PhotoModel,
       *     'product': App.ProductModel
       *   }
       * @type {Object}
       */
      docTypes: {},
      init: function() {
        var that = this;
        this.getDB();
      },
      getDB: function(dbName, options) {
        var that = this, promise = this.get('_dbPromise');
    
        if ( Em.isEmpty(promise) ) {
          promise = this.create(dbName, options);
          promise.then(function(db){
            that.set('_db', db);
            return db;
          });
          this.set('_dbPromise', promise);
        }
        return promise;
      },
      /**
       * Create database by name
       * 
       * @param  {string} name    of the database to create
       * @param  {object} options 
       * @return {promise}        that will resolve to instance of Pouch
       */
      create: function( name, options ) {

        if (typeof name === 'undefined') {
          name = this.get('dbName');
        }

        if (typeof options === 'undefined') {
          options = {};
        }

        var createDB = function(resolve, reject){
          new Pouch(name, options, function(error, db){
            Ember.run(function(){
              if ( error ) {
                reject(error);
              } else {
                resolve(db);
              }
            });

          });
        };

        return new Ember.RSVP.Promise(createDB);
      },
      /**
       * Get all docs of specific docType. The docs will be converted into models before being returned.
       * 
       * @param  {string} docType 
       * @param  {object} options
       * @return {promise}        
       */
      findAll: function(docType, options) {
        var modelClass = this.get('docTypes.'+docType);
        Ember.assert("You have to register %@ docType before you can query by it. Look at docTypes property in PouchStorage class.".fmt(docType), modelClass);

        if ( typeof options === 'undefined' ) {
          options = {
            reduce:false
          };
        }

        options.docType = docType;

        var that = this;

        var findByDocType = function(doc) {
          if (doc.docType === options.docType) {
            emit(doc._id, doc);
          }
        };

        var queryByDocType = function(db){
          return new Ember.RSVP.Promise(function(resolve, reject){
            db.query({map: findByDocType}, options, function(error, response){
              Ember.run(function(){
                if ( error ) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
            });
          });      
        };

        var createModels = function(docs) {
          return Em.A(docs.rows).map(function(doc){
            var model = modelClass.create(doc.value);
            model.setProperties({id:doc.value._id, rev:doc.value._rev});
            return model;
          });
        };

        return this.getDB().then(queryByDocType).then(createModels);
      },
      /**
       * Get a document by id, return a promise that will resolve to an instance of PouchModel
       *
       * options and default values
       * {
       *  rev: undefined     // Fetch specific revision of a document.
       *  revs: []           // Include revision history of the document
       *  revs_info: false   // Include a list of revisions of the document, and their availability.
       *  open_revs: false   // Fetch all leaf revisions if openrevs="all" or fetch all leaf revisions specified in openrevs array. Leaves will be returned in the same order as specified in input array
       *  conflicts: false   // If specified conflicting leaf revisions will be attached in _conflicts array
       *  attachments: false // Include attachment data
       *  local_seq: false   // Include sequence number of the revision in the database
       * }
       * 
       * @param {string} id      of the document to get a model for
       * @param {object} options hash of options
       * @return {promise}       that will resolve to a model
       */
      GET: function(id, options) {

        if ( typeof options === 'undefined' ) {
          options = {};
        }

        var that = this;

        var getDoc = function(db){
          return new Ember.RSVP.Promise(function(resolve, reject){
            db.get(id, options, function(error, response){
              Ember.run(function(){
                if (error) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
            });
          });
        };

        var createModel = function(doc) {
          var model;
          if ( doc.hasOwnProperty('docType') && that.get('docTypes.'+doc.docType)) {
            var modelClass = that.get('docTypes.'+doc.docType);
            model = modelClass.create(doc);
          } else {
            model = Model.create(doc);
          }
          return model;
        };

        return this.getDB().then(getDoc).then(createModel);
      },
      /**
       * Create a new document and let PouchDB generate an _id for it.
       * 
       * @param {PunchModel} model    instance of a decendant of PunchModel
       * @param {object} options      object with options      
       * @return {promise}            which will resolve to updated model
       */
      POST: function(model, options) {
        var
          that          = this, 
          doc           = model.serialize(),
          docType       = this.getDocType(model.constructor);

        Em.assert("Model doesn't have a corresponding doc type.", docType);

        doc['docType'] = docType;

        var postDoc = function(db){
          return new Ember.RSVP.Promise(function(resolve, reject){
            db.post(doc, options, function(error, response){
              Ember.run(function(){
                if ( error ) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
            });
          });
        };

        var addDocInfo = function(info) {
          model.set('id', info.id);
          model.set('rev', info.rev);
          model.set('docType', docType);
          return model;
        };

        return this.getDB().then(postDoc).then(addDocInfo);
      },
      /** 
       * Update an existing document.
       * 
       * @param {model} model   to update
       * @param {object} options 
       * @return {model} [description]
       */
      PUT: function(model, options) {
        var
          that          = this, 
          doc           = model.serialize(),
          docType       = null;

        if ( typeof options === 'undefined' ) {
          options = {};
        }

        if ( !model.get('docType') ) {
          model.set('docType', this.getDocType(model.constructor));
        }

        doc["docType"] = model.get('docType') || this.getDocType(model.constructor);
        doc["_id"] = model.get("id");
        doc["_rev"] = model.get("rev");

        var putDoc = function(db){
          return new Ember.RSVP.Promise(function(resolve, reject){
            db.put(doc, options, function(error, response) {
              Ember.run(function(){
                if ( error ) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
            });
          });
        };

        var updateModel = function(doc) {
          model.setProperties({id: doc.id, rev: doc.rev});
          return model;
        };

        return this.getDB().then(putDoc).then(updateModel);
      },
      /** 
       * Delete document for a model
       * 
       * @param {model} model   must have id & rev properties
       * @param {object} options 
       * @return
       */
      DELETE: function(model, options) {

        var doc;

        if ( typeof options === 'undefined' ) {
          options = {};
        }

        doc = {
          _id: model.get('id'),
          _rev: model.get('rev')
        };

        var removeDoc = function(db){
          return new Ember.RSVP.Promise(function(resolve, reject){
            db.remove(doc, options, function(error, response) {
              Ember.run(function(){
                if (error) {
                  reject(error);
                } else {
                  resolve();
                }
              });
            });
          });      
        };

        return this.getDB().then(removeDoc);
      },
      /**
       * Remove the database
       * @return {promise}
       */
      remove: function(options) {

        var that = this, dbName = that.get('dbName');

        if ( typeof options === 'undefined' ) {
          options = {};
        }

        var removeDB = function(resolve, reject){
          Pouch.destroy(dbName, function(error, info){
            Ember.run(function(){
              if (error) {
                reject(error);
              } else {
                resolve(info);
              }          
            });
          });
        };

        return new Ember.RSVP.Promise(removeDB);
      },
      getDocType: function(modelClass) {
        var 
          found     = false,
          docTypes  = this.get('docTypes');
        Object.keys(docTypes).find(function(type){
          if ( Em.isEqual(docTypes[type], modelClass) ) {
            found = type;
          }
          return found;
        });
        return found;
      }
    });
    __exports__.Storage = Storage;
  });
define("ember-pouchdb",
  ["ember-pouchdb/get_initializer","ember-pouchdb/model","ember-pouchdb/storage","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var get_initializer = __dependency1__.get_initializer;
    var Model = __dependency2__.Model;
    var Storage = __dependency3__.Storage;

    __exports__.get_initializer = get_initializer;
    __exports__.Model = Model;
    __exports__.Storage = Storage;
  });