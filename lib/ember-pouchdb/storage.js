import { Model } from './model';

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
    this.getDB().then(function(db){
      that.set('_db', db);
    });
  },
  getDB: function(dbName, options) {
    var that = this, getDB;
    
    getDB = function(resolve, reject) {
      var db = that.get('_db'), dbPromise;
      if (Em.isEmpty(db)) {
        if (Em.isEmpty(that.get('_dbPromise'))) {
          that.set('_dbPromise', that.create(dbName,options));
        }
        resolve(that.get('_dbPromise'));
      } else {
        resolve(db);
      }
    };
    
    return new Ember.RSVP.Promise(getDB);
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
    
    Ember.run.scheduleOnce('destroy', Pouch, 'destroy', dbName, options);
    
    return this;
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
export {Storage};