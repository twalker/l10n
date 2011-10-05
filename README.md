#l10n
A submodule (currently adding to jQuery.l10n) for retrieving localized text.

culture : Current culture ISO code from navigator.language.
    
    $.l10n.culture.region; // 'US'
    $.l10n.culture.fromISOString('fr-CA').region; // 'CA'
    
getText : Promises to retrieve a localized text object from a localization endpoint.

    $.when($.l10n.getText('/l10n/gettext', { package: 'scroller' }) 
      .then(function(oTxt){
        $.scroller.setDefaults({prev: oTxt.get('Previous'), next: oTxt.get('Next')});
      });

getScript : Promises to load a localization script based on the current culture.

    $.l10n.getScript('js/datepicker_ISO.js', function(){
      // Will try loading a script based on current culture 
      // (e.g. js/datepicker_en-US.js or js/datepicker_en.js),
      console.log('script was loaded and executed, invoking an optional callback.');
    });

###Goals

* Keep hard-coded text out of functional js.
* Be asynchronous and not block rendering (use promises).
* Client does not fetch text/scripts for cultures other than the current culture.
* Cache with sessionStorage remembered promises.
* Be portable: server agnostic, easily added to custom namespace

###Dependencies

* jQuery 1.5+
* json2.js
