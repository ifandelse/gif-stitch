/* global require */
require.config({

	paths: {
		backbone   : "lib/backbone-min",
		backbrace  : "lib/backbrace",
		bootstrap  : "lib/bootstrap.min",
		jquery     : "lib/jquery-1.10.2.min",
		jqbase64   : "lib/jquery.base64.min",
		machina    : [ "http://cdnjs.cloudflare.com/ajax/libs/machina.js/0.3.4/machina.min", "lib/machina" ],
		monologue  : "lib/monologue.min",
		monopost   : "lib/monopost.min",
		neuquant   : "lib/NeuQuant",
		omggif     : "lib/omggif",
		postal     : "lib/postal",
		diags      : "lib/postal.diagnostics.min",
		riveter    : "lib/riveter.min",
		text       : "lib/text",
		underscore : "lib/underscore-min"
	},

	shim : {
		backbone : {
			deps : ["jquery", "underscore"],
			exports : "Backbone"
		},
		bootstrap : {
			deps : ["jquery"]
		},
		jqbase64 : {
			deps : ["jquery"],
			exports : "jQuery"
		},
		neuquant : {
			exports : "NeuQuant"
		},
		omggif : {
			exports : "GifWriter"
		},
		underscore : {
			exports : "_"
		}
	}
});

// load foundational libs
require( [ "infrastructure" ], function () {
	require( [ "app" ], function ( app ) {
		app.init();
	} );
} );
