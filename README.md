#l10n
A submodule (currently adding to jQuery.l10n) for retrieving localized text.

culture : Current culture ISO code from navigator.language.
    
    $.l10n.culture.region; // 'US'
    $.l10n.culture.fromISOString('fr-CA').region; // 'CA'
    
getText : Promises to retrieve a localized text object from a localization endpoint.

    $.when($.l10n.getText({packages: ['scroller']}) 
      .then(function(oTxt){
        $.scroller.setDefaults({prev: oTxt.get('Previous'), next: oTxt.get('Next')});
      });

getScript : Loads a localized script based on the current culture.

    $.l10n.getScript('js/datepicker_ISO.js', function(){
      // Will try loading a script based on current culture 
      // (e.g. js/datepicker_en-US.js or js/datepicker_en.js),
      console.log('script was loaded and executed, invoking an optional callback.');
    });

###Goals
* Keep hard-coded text out of functional js.
* Be asynchronous and not block rendering (use promises).
* Client does not fetch text of different cultures.
* Use sessionStorage when available.
* Be portable: server agnostic, easily added to custom namespace

###Dependencies

* jQuery 1.5+
* json2.js

###TODO:

* simplify getText args to (url, params)
* re-consider using CommonJS module pattern instead
* manage individual packages in storage
* create sample getText endpoint using node
