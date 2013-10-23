var Model = Ember.Object.extend( Ember.Copyable, {
  copy: function() {
    return this.constructor.create(this.serialize());
  },
  serialize: function() {
    throw new Error(Ember.String.fmt("%@ must implement serialize() method which returns JSON of this model.", [this]));
  }
});

export {Model};