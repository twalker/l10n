$(document).ready(function(){

	// helper methods to deal with sessionStorage and emulate i18n.getText's key creation, 
	// so we can removeItems from storage without also clearing QUnit's sessionStorage.
	var supportsStorage = (function(){
		return sessionStorage && sessionStorage.getItem;
	})();

	function generateStorageKey(iso, packages){
		var storageKey = 'l10n:' + iso + ':' + ($.isArray(packages) ? packages.join(',') : packages);
		return storageKey;
	}
	
	function clearTextStorage(storageKey){
		if(supportsStorage){
			console.info('clearing', storageKey);
			sessionStorage.removeItem(storageKey);
		}
	}

	module("i18n", {
		setup: function(){
			this.fakePackage = {"previous": "Poprzedni","next": "Następna"};
		},
		teardown: function(){
			$.l10n.culture.lang = "en";
			$.l10n.culture.region = "US";
		}
	});

	test("culture", 4, function(){
		equal($.l10n.culture.toISOString().toLowerCase(), (navigator.language || navigator.browserLanguage).toLowerCase(), "should default to browser language");
		
		$.l10n.culture.fromISOString("de-DE");
		equal($.l10n.culture.region, "DE", "should set the region from an ISO code");
		equal($.l10n.culture.lang, "de", "should set the lang from an ISO code");
		
		$.l10n.culture.fromISOString("es");
		equal($.l10n.culture.toISOString(), 'es', "should handle missing region codes")
	});
	
	test("getText", 8, function(){
		var fakeServer = sinon.sandbox.useFakeServer(),
				cbResolve = sinon.spy(),
				cbResolveAfter = sinon.spy(),
				cbReject = sinon.spy(),
				getSpy = sinon.spy(),
				storageKey = generateStorageKey('en-US', ['packageA','packageB']),
				promise1, promise2;
		
		fakeServer.respondWith(
			"GET", /fake\/service/,
		  [200, { "Content-Type": "application/json" }, JSON.stringify(this.fakePackage)]
		);
		promise1 = $.l10n.getText({url: 'fake/service', packages: ['packageA','packageB']}).done(cbResolve);
		
		fakeServer.respond();
		
		ok(cbResolve.called, "should call done callback.");
		var oText = cbResolve.getCall(0).args[0];
		//ok(cbResolve.calledWith(this.fakePackage), "should pass done the localized text object.");
		equal(oText.previous, 'Poprzedni', "should pass done the localized text object.");
		
		equal(oText.get('previous'), 'Poprzedni', "should extend the localized text object with a get method");
		equal(oText.get('no exist'), 'no exist!NOTFOUND!', "extended get method should return the key when it doesn't exist in the object, appending !NOTFOUND! to make it obvious from UI.");
		oText.get('next', getSpy);
		ok(getSpy.calledWith('Następna'), "extended get method should allow a callback and call it when the key exists.");

		promise2 = $.l10n.getText({url: 'fake/service', packages: ['packageA','packageB']}).done(cbResolveAfter);
		ok(cbResolveAfter.called, "should call done callback even with reused promises.");
		
		//ok(cbResolveAfter.calledWith(this.fakePackage), "should call subsequent resolve handlers the localized text object");
		equal(cbResolveAfter.getCall(0).args[0]['previous'], 'Poprzedni', "should call subsequent resolve handlers the localized text object");
		
		equal(promise1, promise2, "Should reuse promises for subsequent calls for the same text.");
		
		// cleanup
		clearTextStorage(storageKey);
	});

	test("getText (multiple invocations in $.when construct)", 2, function(){
		var fakeServer = sinon.sandbox.useFakeServer(),
				storageKey1 = generateStorageKey('en-US', 'packageA'),
				storageKey2 = generateStorageKey('en-US', 'packageB'),
				package1 = {hi:'mom'},
				package2 = {hello:'dad'};

		
		fakeServer.respondWith(
			"GET", /fakeservice\?culture=en-US&packages=packageA/,
		  [200, { "Content-Type": "application/json" }, JSON.stringify(package1)]
		);
		fakeServer.respondWith(
			"GET", /fakeservice\?culture=en-US&packages=packageB/,
		  [200, { "Content-Type": "application/json" }, JSON.stringify(package2)]
		);
		
		$.when(
			$.l10n.getText({url: 'fakeservice', packages: 'packageA'}),
			$.l10n.getText({url: 'fakeservice', packages: 'packageB'})
			)
			.then(
				function(p1, p2){
					equal(p1.get('hi'), 'mom', "should pass then first call's text object as first argument");
					equal(p2.get('hello'), 'dad', "should pass then second call's text object as second argument");
				});
		
		fakeServer.respond();
		
		// cleanup
		clearTextStorage(storageKey1);
		clearTextStorage(storageKey2);
	});

	
	
	test("getText (rejection)", 2, function(){
		var fakeServer = sinon.sandbox.useFakeServer(),
				cbReject = sinon.spy(),
				storageKey = generateStorageKey('en-US', document.location.pathname, []);

		var promise3 = $.l10n.getText({url: 'no/exist'}).fail(cbReject);
		fakeServer.respond();
		
		ok(cbReject.called, "should call reject/fail callbacks.");
		ok(cbReject.calledWith("Not Found"), "should pass reject/fail callbacks error message.");
	});
	
	test("getText (primed session storage)", 1, function(){
		var stored = {hi: "mom"};
		if(supportsStorage){
			sessionStorage.setItem(generateStorageKey('en-US', 'packageA'), JSON.stringify(stored));
			$.l10n.getText({packages: ['packageA']}).done(function(oTxt){
				equal(oTxt.get('hi'), 'mom', "Should retrieve text objects from session sessionStorage.");
			});
		} else {
			ok(true, "Skipping storage tests for this browser since it doesn't support sessionStorage.")
		}
	});
	
	test("getScript: nonISO", 3, function(){
		var fakeServer = sinon.sandbox.useFakeServer(),
				cbSpy = sinon.spy(),
				cbDone = sinon.spy();
		
		fakeServer.respondWith(
			"GET", 
			/datepicker/,
		  [200, { "Content-Type": "application/javascript" }, "var coolness = 'promises';"]
		);

		$.l10n.getScript('datepicker', cbSpy).done(cbDone);
		fakeServer.respond();
		
		ok(cbSpy.called, "Should allow nonISO scripts to pass through.");
		equal(coolness, "promises", "Should also execute the script.");
		ok(cbDone.called, "Should return a promise.");
		
	});
	
	test("getScript: ISO region and lang", 3, function(){
		var fakeServer = sinon.sandbox.useFakeServer(),
				cbSpy = sinon.spy(),
				cbDone = sinon.spy();
		fakeServer.respondWith(
			"GET", /datepicker_fr-FR/,
		  [200, { "Content-Type": "application/javascript" }, "var hi = 'mom';"]
		);
		
		$.l10n.culture.fromISOString("fr-FR");
		$.l10n.getScript('datepicker_ISO', cbSpy).done(cbDone);

		fakeServer.respond();
		
		ok(cbSpy.called, "Should replace 'ISO' token in script name with culture string (region and lang).");
		equal(hi, "mom", "Should also excecute the script.");
		ok(cbDone.called, "Should return a promise.");
	});
	
	test("getScript: ISO only lang", 3, function(){
		var fakeServer = sinon.sandbox.useFakeServer(),
				cbSpy = sinon.spy(),
				cbDone = sinon.spy();

		fakeServer.respondWith(
			"GET", /datepicker_fr.js/,
		  [200, { "Content-Type": "application/javascript" }, "var spider = 'man';"]
		);
		generateStorageKey('en-US', document.location.pathname, ['packageA','packageB'])
		$.l10n.culture.fromISOString("fr-CA");
		$.l10n.getScript('datepicker_ISO.js', cbSpy).done(cbDone);
		// First request should fail--datepicker_fr-CA.js
		fakeServer.requests[0].respond(404, {}, "");
		//Second response should succeed--datepicker_fr.js
		fakeServer.respond();

		ok(cbSpy.called, "Should replace 'ISO' token in script name with culture string (lang only).");
		ok(cbDone.called, "Should return a promise.");
		equal(typeof(spider), "string", "Should also execute the script.");
	});
	

});
