define( [
	'backbrace',
	'jquery',
	'underscore',
	'views/GifItem'
], function ( backbrace, $, _, GifItem ) {
	return backbrace.CollectionView.extend( {
		el : "#gifs",

		viewType : GifItem,

		subscriptions : {
			onGifStarted : 'gifs gif.started'
		},

		onGifStarted : function ( data ) {
			this.addChild( new Backbone.Model( { progress : 0, id : data.gifId, fileName : data.gifId } ) );
		}
	} );
} );