define([
	'backbone'
], function ( Backbone ) {
	return Backbone.Model.extend( {
		defaults : {
			framesPerGif : 10,
			frameInterval : 500,
			delay : 250
		}
	} );
} );