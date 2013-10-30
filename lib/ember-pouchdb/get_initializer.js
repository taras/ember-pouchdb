import {Storage} from './storage';
import {PromiseTracker} from './promise_tracker';

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
      
      if ( Ember.testing ) {
        // Inject Promise Tracker into the storage instance
        application.register("promiseTracker:pouch", PromiseTracker);
        application.inject(options.fullName, "tracker", "promiseTracker:pouch");
      }
      
    };
  }

  options['initialize'] = initialize;

  return options;
};

export {get_initializer};