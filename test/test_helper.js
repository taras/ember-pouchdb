document.write('<div id="ember-testing-container"><div id="ember-testing"></div></div>');

Ember.testing = true;

window.startApp = function startApp(attrs, initializers) {
  var App;

  var attributes = Ember.merge({
    // useful Test defaults
    rootElement: '#ember-testing',
    LOG_ACTIVE_GENERATION:false,
    LOG_VIEW_LOOKUPS: false
  }, attrs); // but you can override;

  Ember.run.join(function(){
    App = Ember.Application.create(attributes);
    App.setupForTesting();
    App.injectTestHelpers();

    if ( initializers ) {
      initializers.forEach(function(initializer){
        App.initializer(initializer);
      });
    } 
  });

  App.reset(); // this shouldn't be needed, i want to be able to "start an app at a specific URL"

  return App;
};

function exists(selector) {
  return !!find(selector).length;
}

function equal(actual, expected, message) {
  message = message || QUnit.jsDump.parse(expected) + " expected but was " + QUnit.jsDump.parse(actual);
  QUnit.equal.call(this, actual, expected, message);
}

window.exists = exists;
window.equal = equal;
