define([
	'backbrace',
    'jquery',
    'underscore',
    'text!templates/gifItemTemplate.html',
    'text!templates/progressTemplate.html',
    'text!templates/capturingTemplate.html',
    'postal',
    'machina'
], function( backbrace, $, _, gifItemTemplate, progressTemplate, capturingTemplate, postal, machina ){

	var Fsm = machina.Fsm.extend({

		initialState: "capturing",

		states: {
			capturing: {
				render: function() {
					this.$el.html(this.capturingTemplate);
				},
				stop : "stopped"
			},
			stitching: {
				render: function() {
					this.$el.html( this.progTemplate( this.model.toJSON() ));
				},
				stop : "stopped"
			},
			rendered: {
				render: function() {
					this.$el.html( this.imgTemplate( this.model.toJSON() ));
				},
				stop : "stopped"
			},
			stopped : {
				_onEnter: function() {
					this.remove();
				}
			}
		},

		render: function() {
			this.handle("render");
			return this;
		}
	});

	var View = backbrace.View.extend({

		initialize: function() {
			_.extend(this, new Fsm());
			this.imgTemplate = _.template( gifItemTemplate );
			this.progTemplate = _.template( progressTemplate );
			this.capturingTemplate = _.template( capturingTemplate );
			this.model.on( "change", _.bind( this.render, this ));
			postal.subscribe({
				channel  : "omggif",
				topic    : "#",
				callback : function(d,e) {
					var handler = "on" + e.topic;
					if(this[handler]) {
						this[handler].call(this, d);
					}
				}
			}).withContext(this)
				.withConstraint(function(d, e){
					return  d.gifId === this.model.get("id");
				});
		},

		subscriptions: {
			onGifStopped : "gifs gif.stopped"
		},

		attributes: {
			"class" : "gif-item img"
		},

		events: {
			"click .glyphicon-remove" : "remove",
			"click .glyphicon-save"   : "onDownload",
			"click #lblFileName"      : "editFileName",
			"blur #fileName"          : "setFileName",
			"keyup #fileName"         : "handleEnterKey"
		},

		editFileName : function() {
			this.$("#lblFileName" ).hide();
			this.$("#fileName").show();
		},

		handleEnterKey : function(e) {
			if ( e.keyCode==13 ) {
				this.setFileName();
			}
		},

		setFileName: function() {
			var val = this.$("#fileName" ).val();
			this.model.set("fileName", val, { silent: true });
			this.$("#lblFileName").text(val);
			this.$("a[download]" ).attr("download", val);
			this.$("#lblFileName" ).show();
			this.$("#fileName").hide();
		},

		onDownload: function() {
			var img = this.$('img')[0];
			var url = img.src.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
			window.open(url);
		},

		ongif: function(data) {
			this.transition("rendered");
			this.model.set(data, { silent: true });
			this.render();
		},

		onprogress: function(data) {
			if(this.state !== "stitching") {
				this.transition("stitching");
			}
			this.model.set(data);
		}
	});

	return View;
});
