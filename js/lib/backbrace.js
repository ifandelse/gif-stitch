/*
  backbrace
  © 2012 - Copyright appendTo, LLC
  Author(s): Jim Cowart, Doug Neiner
  License: Dual licensed MIT (http://opensource.org/licenses/MIT) & GPL (http://opensource.org/licenses/GPL-2.0)
  Version 0.0.1
 */
(function ( root, factory ) {
  if ( typeof module === "object" && module.exports ) {
    // Node, or CommonJS-Like environments
    module.exports = function(_, Backbone, riveter, postal) {
      return factory( _, Backbone, riveter, postal );
    }
  } else if ( typeof define === "function" && define.amd ) {
    // AMD. Register as an anonymous module.
    define( ["underscore", "backbone", "riveter", "postal"], function ( _, backbone, riveter, postal ) {
      return factory( _, backbone, riveter, postal, root );
    } );
  } else {
    // Browser globals
    root.backbrace = factory( root._, root.Backbone, root.riveter, root.postal, root );
  }
}( window || this, function ( _, Backbone, riveter, postal, root, undefined ) {

  var backbrace = root.backbrace || {};

  var TAG_REGEX = /^<([a-z][a-z0-9]*)[^>]*>(.*?)<\/\1>$/i;
  backbrace.View = Backbone.View.extend( {
    // DOM manipulation should be limited to the scope of the view
    // So let's remove the need for global jQuery/$ access
    $ : function ( selector ) {
      if ( _.isObject( selector ) || TAG_REGEX.test( selector ) ) {
        return $( selector );
      }
      return this.$el.find( selector );
    },
  
    // Similar idea to what backbone.marionette does, but tweaked.
    // This provides base "toJSON()" behavior for any view to call
    // for default-approach binding of model data to template, etc.
    dataToJSON : function () {
      var data = {};
      if ( this.model ) {
        data = this.model.toJSON();
      }
      if ( this.collection ) {
        _.extend(data, { items : this.collection.toJSON() });
      }
      return data;
    }
  });
  // currently just assigning as placeholder for later extensions
  backbrace.Model = Backbone.Model;
  var messagingMixin = backbrace.messagingMixin = {
    _preInit: function(attributes, options) {
      options = (this instanceof Backbone.View ? attributes : options) || {};
      this.subscriptions = _.extend({}, this.subscriptions, options.subscriptions);
      this.publications = _.extend({}, this.publications, options.publications);
      this.messaging = this.messaging || {};
      this.configureMessaging();
    },
    mixin: {
      configureMessaging: function() {
        this.setupSubscriptions();
        this.bridgeEvents();
      },
  
      bridgeEvents: function() {
        this.unbridgeEvents();
        if (!_.isEmpty(this.publications)) {
          _.each(this.publications, function(publication, evnt) {
            var _publication = publication;
  
            if (!this.messaging.publications[evnt]) {
              this.messaging.publications[evnt] = {};
            }
  
            if (!_.isObject(publication)) {
              _publication = {};
              _publication[publication] = _.identity;
            }
  
            _.each(_publication, function(accessor, pub) {
              var meta = pub.split(' ');
              var channel = meta[0];
              var topic = meta[1];
              var listener = function() {
                var args = Array.prototype.slice.call(arguments, 0);
                var data = accessor.apply(this, args);
                postal.publish({
                  channel: channel,
                  topic: topic,
                  data: data || {}
                });
              };
  
              this.on(evnt, listener, this);
              this.messaging.publications[evnt][pub] = _.bind(function() {
                this.off(evnt, listener);
              }, this);
            }, this);
          }, this);
        }
      },
  
      unbridgeEvents: function() {
        if (this.messaging.publications) {
          _.each(this.messaging.publications, function(publication) {
            _.each(publication, function(pub) {
              while (pub.length) {
                pub.pop()();
              }
            });
          });
        }
  
        this.messaging.publications = {};
      },
  
      setupSubscriptions: function() {
        this.unwindSubscriptions();
        if (!_.isEmpty(this.subscriptions)) {
          _.each(this.subscriptions, function(sub, handler) {
            sub = _.isArray(sub) ? sub : [sub];
            _.each(sub, function(subscription) {
              var meta = subscription.split(' ');
              var channel = meta[0];
              var topic = meta[1];
              // TODO: After adding app.warn, perhaps consider warning if handler/channel are not present...
              if (this[handler]) {
                this.messaging.subscriptions[subscription] = postal.subscribe({
                  channel: channel,
                  topic: topic,
                  callback: this[handler]
                }).withContext(this);
              }
            }, this);
          }, this);
        }
      },
  
      unwindSubscriptions: function() {
        if (this.messaging.subscriptions) {
          _.each(this.messaging.subscriptions, function(sub) {
            sub.unsubscribe();
          });
        }
  
        this.messaging.subscriptions = {};
      }
    }
  };
  var modelValidationMixin = backbrace.modelValidationMixin = {
    validate : function (attributes) {
      if(this.rules) {
        var targetState = _.extend(this.toJSON(), attributes);
        this.set("_errors", {}, { silent: true });
        var errors = {};
        _.each(attributes, function (value, key) {
          if(this.rules[key]){
            var val = $.trim(value);
            var idx = 0;
            var pass;
            for(; idx < this.rules[key].length; idx++) {
              (function(rule){
                rule = rule.predicate ? rule : { predicate: rule, errorMsg: "The 'key' has validation errors." };
                pass = rule.predicate.call(this, val, targetState);
                var msg = rule.errorMsg;
                if(Object.prototype.toString.call(pass) === '[object String]') {
                  msg = pass || rule.errorMsg;
                  pass = !pass; // if we got a string back, it's an error message, so the field failed the predicate
                }
                if (!pass) {
                  if(!errors[key]) {
                    errors[key] = [];
                  }
                  errors[key].push(msg);
                }
              })(this.rules[key][idx]);
              if(!pass && this.rules[key][idx].stopIfBroken) {
                break;
              }
            }
          }
        }, this);
        this.set("_errors", errors, { silent: true });
        // Return only when errors exist.
        if (!_.isEmpty(errors)) {
          return errors;
        }
      }
    },
    hasErrors : function() {
      return !_.isEmpty(this.get("_errors"));
    }
  };
  var viewValidation = backbrace.viewValidation = {
    getValidationTarget : function() {
      return '.validation';
    },
  
    showValidation : function ( model, errors ) {
      var target;
      if ( target = this.getValidationTarget() ) {
        _.each( errors, function ( error, name ) {
          this.$( "[name='" + name + "']" )
            .closest( target )
            .addClass( 'error' );
        }, this );
      }
    },
  
    useValidatedModel : function ( model ) {
      if ( this.model && this.model !== model ) {
        this.model.off( 'error', this.showValidation, this );
      }
      this.model = model;
      this.model.on( 'error', this.showValidation, this );
    }
  };
  var collectionViewMixin = backbrace.collectionViewMixin = {
    _postInit : function () {
      this.childViews = {};
      if(this.collection) {
        this.collection.on("reset",  this.render,      this);
        this.collection.on("add",    this.addChild,    this);
        this.collection.on("remove", this.removeChild, this);
      }
    },
  
    mixin: {
      getViewConstructor : function (model) {
        var viewType = this.options.viewType || this.viewType;
        if (!viewType) {
          throw new Error("A `viewType` must be specified");
        }
        return viewType;
      },
  
      // Initializes view for each model within the collection.
      addChild : function (model) {
        var index = this.collection.indexOf(model);
        var ViewCtor = this.getViewConstructor(model);
        var viewInstance = new ViewCtor({ model: model });
        this.childViews[model.cid] = viewInstance;
        this.renderChild(viewInstance, index);
      },
  
      renderChild: function(view, index) {
        view.render();
        this.$el.append(view.$el);
      },
  
      removeChild : function (model) {
        if (this.childViews[model.cid]) {
          this.childViews[model.cid].remove();
          delete this.childViews[model.cid];
        }
      },
  
      removeChildView: function(item) {
        this.removeChild(item.model);
      },
  
      removeAllChildren: function() {
        _.each(this.childViews, this.removeChildView, this);
      },
  
      remove : function () {
        this.removeAllChildren();
        this.undelegateEvents();
        this.$el.remove();
        return this;
      },
  
      render: function(context) {
        this.trigger('preRender', context);
        this.removeAllChildren();
        this.collection.forEach(function(item){
          this.addChild(item);
        }, this);
        this.trigger('rendered', context);
      }
    }
  };

  riveter( backbrace.View );
  riveter( backbrace.Model );

  backbrace.View = backbrace.View.compose( messagingMixin, viewValidation );
  backbrace.CollectionView = backbrace.View.compose( messagingMixin, collectionViewMixin );
  backbrace.Model = backbrace.Model.compose( messagingMixin, modelValidationMixin );

  return backbrace;

} ));