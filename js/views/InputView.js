define([
	'backbrace',
	'jquery',
	'underscore',
	'../InputModel',
	'text!templates/InputViewTemplate.html'
], function ( backbrace, $, _, InputModel, template ) {

	var errBack = function ( error ) {
		alert( "OHSNAP! Video capture error: " + error.code );
	};

	return backbrace.View.extend( {
		el : '#input-form',

		initialize : function () {
			this.template = _.template( template );
			this.polling = false;
			this.frames = [];
			this.model = new InputModel();
		},

		events : {
			"click #start"             : "startCaptures",
			"click #stop"              : "stopCaptures",
			"blur input[type='text']"  : "handleConfigChange",
			"keyup input[type='text']" : "checkIfConfigChange",
			"change #downloadMode"     : "handleModeChange"
		},

		publications : {
			framesready : "omggif frames.ready",
			gifstarted  : "gifs gif.started",
			gifstopped  : "gifs gif.stopped",
			modeChange  : "gifs mode.change"
		},

		subscriptions : {
			onGifGenerated : "omggif gif"
		},

		capture : function () {
			var self = this;
			if ( this.frames.length < this.model.get( "framesPerGif" ) ) {
				if ( this.frames.length === 0 ) {
					this.currentGifId = _.uniqueId( "gif_" );
					this.trigger( "gifstarted", { gifId : this.currentGifId } );
				}
				this.context.drawImage( this.video, 0, 0, 720, 450 );
				var imageData = this.context.getImageData( 0, 0, this.canvas.width, this.canvas.height );
				this.frames.push( imageData );
				this.startPoll();
			} else {
				_.defer(function() {
					self.trigger( "framesready", {
						frames      : self.frames,
						delay       : self.model.get( "delay" ),
						matte       : [255, 255, 255],
						transparent : [0, 255, 0],
						gifId       : self.currentGifId
					} );
					self.frames = [];
					self.currentGifId = undefined;
				});
			}
		},

		handleConfigChange: function(e) {
			this.model.set({
				framesPerGif  : this.framesPerGif.val(),
				frameInterval : this.frameInterval.val(),
				delay         : this.delay.val()
			});
		},

		handleModeChange: function() {
			this.trigger("modeChange", { mode: this.downloadMode.val() });
		},

		checkIfConfigChange: function(e) {
			if ( e.keyCode == 13 ) {
				this.handleConfigChange();
			}
		},

		onGifGenerated : function () {
			this.startPoll();
		},

		cacheSelectors : function () {
			this.canvas = document.getElementById( "canvas" );
			this.context = self.canvas.getContext( "2d" );
			this.video = document.getElementById( "video" );
			this.framesPerGif = self.$( "#framesPerGif" );
			this.frameInterval = self.$( "#frameInterval" );
			this.downloadMode = self.$( "#downloadMode" );
			this.delay = self.$( "#delay" );
		},

		render : function () {
			var self = this;
			var videoObj = {
				"video" : true
			};
			self.$el.html( self.template(self.model.toJSON() ));
			self.cacheSelectors();
			if ( navigator.getUserMedia ) { // Standard
				navigator.getUserMedia( videoObj, function ( stream ) {
					self.video.src = stream;
					self.video.play();
				}, errBack );
			} else if ( navigator.webkitGetUserMedia ) { // WebKit-prefixed
				navigator.webkitGetUserMedia( videoObj, function ( stream ) {
					self.video.src = window.webkitURL.createObjectURL( stream );
					self.video.play();
				}, errBack );
			}
			return self;
		},

		startPoll : function () {
			if ( this.polling ) {
				this.poll = setTimeout( _.bind( this.capture, this ), this.model.get( "frameInterval" ) );
			}
		},

		startCaptures : function () {
			this.polling = true;
			this.$( "#start" ).attr( "disabled", "disabled" );
			this.$( "#stop" ).removeAttr( "disabled" );
			this.startPoll();
		},

		stopCaptures : function () {
			this.polling = false;
			this.$( "#start" ).removeAttr( "disabled" );
			this.$( "#stop" ).attr( "disabled", "disabled" );
			clearTimeout( this.poll );
			this.trigger( "gifstopped" );
		}
	} );
} );