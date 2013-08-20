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
			var self = this;
			self.template = _.template( template );
			self.polling = false;
			self.frames = [];
			self.model = new InputModel();
		},

		events : {
			"click #start" : "startCaptures",
			"click #stop"  : "stopCaptures"
		},

		publications : {
			framesready : "omggif frames.ready",
			gifstarted  : "gifs gif.started",
			gifstopped  : "gifs gif.stopped"
		},

		subscriptions : {
			onGifGenerated : "omggif gif"
		},

		capture : function () {
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
				this.trigger( "framesready", {
					frames      : this.frames,
					delay       : this.model.get( "delay" ),
					matte       : [255, 255, 255],
					transparent : [0, 255, 0],
					gifId       : this.currentGifId
				} );
				this.frames = [];
				this.currentGifId = undefined;
			}
		},

		onGifGenerated : function () {
			this.startPoll();
		},

		render : function () {
			var self = this;
			var videoObj = {
				"video" : true
			};
			self.$el.html( self.template() );
			self.canvas  = document.getElementById( "canvas" );
			self.context = self.canvas.getContext( "2d" );
			self.video   = document.getElementById( "video" );
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