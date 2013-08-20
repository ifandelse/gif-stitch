define([
	'backbone',
	'jqbase64',
	'views/InputView',
    'views/GifCollectionView',
    'GifWorker'
], function( Backbone, $, InputView, GifCollectionView, GifWorker ){
	var app = {
		views: { items: [] },
		init : function() {
			var self = this, worker;
			self.views.input = new InputView().render();
			self.views.gitList = new GifCollectionView({ collection: new Backbone.Collection() });
			worker = self.gifWorker = GifWorker.init();
			worker.on('error', function (e) {
				alert(e);
			});
		}
	};
	return app;
});