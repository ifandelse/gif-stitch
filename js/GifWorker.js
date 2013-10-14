define([
	"monologue",
	"urlHelpers",
	"postal"
], function ( Monologue, urlHelpers ) {
	return _.extend( {

		notifyWorker : function ( d, e ) {
			this.worker.postMessage( d );
		},

		init : function () {
			var self = this;
			self.worker = new Worker( "js/omggif-worker.js" );
			self.worker.addEventListener( 'message', function ( e ) {
				if ( e.data && e.data.type === "gif" ) {
					self.emit( "gif", {
						binaryURL : urlHelpers.toBinary( e.data.data ),
						rawDataURL : urlHelpers.toRawData( e.data.data ),
						dataURL : urlHelpers.toData( urlHelpers.toRawData( e.data.data ) ),
						gifId : e.data.gifId
					} );
                } else if ( e.data && e.data.type === "gifmeta" ) {
                    self.emit( "gifmeta", {
                        gifId : e.data.gifId,
                        encodeTime : e.data.encodeTime,
                        frameCount : e.data.frameCount
                    } );
                } else if ( e.data && e.data.type === "progress" ) {
					self.emit( "progress", {
						gifId : e.data.gifId,
						progress : parseInt((e.data.data * 100 ),10) //rounding to int
					} );
				}
			}, false );
			self.worker.addEventListener( 'error', function ( e ) {
				self.emit( "error", e );
				self.worker.terminate();
			}, false );

			self.goPostal( "omggif" );
			self.goLocal( {
				"omggif frames.addFrame" : "notifyWorker",
				"omggif frames.ready"    : "notifyWorker"
			} );
			return self;
		}
	}, new Monologue() );
} );