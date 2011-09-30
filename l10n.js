(function(parent, $){
	
	
	/**
	 * @name l10n
	 * l10n provides internationalization methods.
	 * 
	*/
	// Create a non-destructive reference to l10n object. 
	var self = parent.l10n = parent.l10n || {}; 
	/**
	 * @name l10n.culture
	 * Current culture ISO code, to be set early on by the server and used by l10n submodules.
	 */
	self.culture = {
		//ISO 639-1: Two-letter lowercase culture code associated with a language.
		lang: null, 
		// ISO 3166-1 alpha-2: Two-letter uppercase subculture code associated with a country or region.
		region: null, 
		fromISOString: function(isoString){
			var parts = isoString.split('-');
			this.lang = parts[0].toLowerCase();
			this.region = (parts.length > 1) ? parts[1].toUpperCase() : null;
			
			return this;
		},
		toISOString: function(){
			return (this.region) ? [this.lang, this.region].join('-') : this.lang;
		}
	};
	// Default to the browser's culture.
	self.culture.fromISOString(navigator.language || navigator.browserLanguage);
	
	
	/**
	 * Promises to retrieve a localized text object from a localization endpoint.
	 * All arguments are optional. A 'get' method is also mixed
	 * into the returned localized text object to detect if a key exists. 
	 * 
	 * @param {object} [options] containing the following:
	 * @param options.url {string}[url="/l10n/gettext"]} The endpoint to retrieve localized text object in json.
	 * @param options.packages {string[]} Array of package names to retrieve from json service.
	 * @returns {promise} Returns a Deferred promise.
	 * 
	 * @example
	 * // retrieves the localized text 'package' for setting the default text of a plugin.
	 * $.when($.l10n.getText({packages: ['scroller]}) 
	 * 	.then(function(oTxt){
	 * 		$.scroller.setDefaults({prev: oTxt.get('Previous'), next: oTxt.get('Next')});
	 *	});
	 *
	 * // specifying the url to get a 'validation' package.
	 * $.when($.l10n.getText({url: '/my/endpoint', packages: 'validation'})
	 * 	.then(function(oTxt){
	 *		jQuery.validator.messages.required = oTxt.Required;
	 * 	});
	 * 
	 * // Using the get mixin.
	 * l10n.getText().done(function(oTxt){
	 * 	oTxt.get('no exist'); // ==> "no exist!NOTFOUND!"
	 * 	oTxt.get('ExistingKey'); // ==> "some existing value"
	 * 	// optional callbacks fire for existing keys and pass the value along.
	 * 	oTxt.get('ExistingKey', function(val){
	 * 		// do something fun with val.
	 * 	}); // still returns "ExistingKey"
	 * });
	*/
	
	self.getText = (function($){
		var promised = {},
			supportsSessionStorage = (function () {
			try {
				return !!sessionStorage.getItem;
			} catch (e) {
				return false;
			}
		})();
		
		// mixes a 'get' method into the localized text object.
		// returns the key when a key doesn't exist.
		var extendText = function(oTxt){
			return $.extend(oTxt, {
				get: function(key, callback){
					var val = this[key] || (key + '!NOTFOUND!');
					if(this.hasOwnProperty(key) && $.isFunction(callback)){
						callback(val);
					}
					return val;
				}
			});
		};
	
		return function(options){
			var settings = $.extend({
					url: '/l10n/gettext',
					packages: [],
					culture: self.culture.toISOString()
				}, options || {}),
				
				query = { culture: settings.culture },
				keyParts = ['l10n', settings.culture],
				storageKey,
				stored,
				dfr;
	
			// Generate a storage key
			// e.g. 'en-US:packageA,packageB'
			if (/https/.test(document.location.protocol)) {
				// Guard from FF3.5+ throwing a security error when accessing https stored items from http.
				keyParts.push('secure');
			}
			if ($.isArray(settings.packages)){
				settings.packages = settings.packages.sort().join(',')
			}
			
			query.packages = settings.packages;
			keyParts.push(settings.packages);
			
			storageKey = keyParts.join(':');

			if(!promised[storageKey]){
				stored = (supportsSessionStorage) ? sessionStorage.getItem(storageKey) : null;
				if (stored === null) {
					dfr = new $.Deferred();
					$.getJSON(settings.url, query)
						.success(function (oText) {
							if (supportsSessionStorage) {
								sessionStorage.setItem(storageKey, JSON.stringify(oText));
							}
							console.info("text loaded from xhr for '" + storageKey + "'");
							dfr.resolve(extendText(oText));
						})
						.error(function(jqXHR, status, error){
								dfr.reject(error);
								console.warn("getText xhr failed for '" + this.url + "'");
						});
				} else {
					dfr = new $.Deferred(function(dfr){
						console.info("text loaded from sessionStorage for '" + storageKey + "'");
						dfr.resolve(extendText(JSON.parse(stored)));
					});
				}
				// return a promise regardless if it's from xhr or sessionStorage.
				promised[storageKey] = dfr.promise();
			}
			
			return promised[storageKey];
		};
	}($));
	
	/**
	 * @name l10n.getScript
	 * Loads a localized script based on the current culture.
	 * 
	 * @param {string} url Base path to script file. Expecting the 'ISO' replacement marker.
	 * @param {function} [callback] Function to call after the script is loaded & executed.
	 * 
	 * @example
	 * l10n.getScript('js/datepicker_ISO.js', callback);
	 * // will try loading js/datepicker_en-US.js, then js/datepicker_en.js
	*/
	self.getScript = function(url, callback){
		var dfr = new $.Deferred(),
				cultureUrl = url.replace('ISO', self.culture.toISOString()),
				langUrl = url.replace('ISO', self.culture.lang);
	
		$.getScript(cultureUrl).then(
				[callback, dfr.resolve],
				function(){
					$.getScript(langUrl).then([callback, dfr.resolve], dfr.reject);
				});
	
		return dfr.promise();
	};
	
	return parent;
})(jQuery, jQuery);