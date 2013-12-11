var PromiseTracker = Ember.ArrayProxy.extend({
  init: function(){
    var that = this;
    // register a Waiter function if wait-hooks feature is available
    if ( Ember.FEATURES.isEnabled('ember-testing-wait-hooks') ) {
      Ember.Test.registerWaiter(function() {
         return that.areFulfilled() === true;
      });      
    }
    this.set('content', []);
  },
  newPromise: function(callback) {
    // save a reference to it in the tracker and return a new promise
    var promise = new Ember.RSVP.Promise(callback);
    this.pushObject(promise);
    return promise;
  },
  areFulfilled: function(){
    // return true if all promises are fulfilled
    return this.everyBy('isFulfilled');
  }
});

export {PromiseTracker};