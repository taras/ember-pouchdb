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

export {Model};