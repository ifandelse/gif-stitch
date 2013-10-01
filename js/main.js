require.config({

	paths: {
		backbone   : "lib/backbone-min",
		backbrace  : "lib/backbrace",
		bootstrap  : "lib/bootstrap.min",
		jquery     : "lib/jquery-1.10.2.min",
		jqbase64   : "lib/jquery.base64.min",
		machina    : "lib/machina",
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
require( [ "diags", "backbone", "bootstrap", "jqbase64", "monopost"], function (DiagnosticsWireTap) {
	//var wireTap = new DiagnosticsWireTap({ name: "console" });
	// now load up the app
	require( ["app", "postal"], function ( app, postal ) {
		window.postal = postal;
		app.init();
	} );
} );
