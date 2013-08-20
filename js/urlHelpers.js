define({
	toRawData : function ( data ) {
		return $.base64.encode( data );
	},

	toData : function ( data ) {
		return 'data:image/gif;base64,' + data;
	},

	toBinary : function ( data ) {
		window.URL = window.URL || window.webkitURL;
		var blob = new Blob( [data], {type : 'image/gif'} );
		return window.URL.createObjectURL( blob );
	}
});