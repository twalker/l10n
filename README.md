#l10n
A submodule (currently exending jQuery.l10n) for retrieving localized text.


###Goals

* Be asynchronous and not block rendering.
* Client does not fetch text of different cultures.
* Use sessionStorage when available.
* Be portable: server agnostic, easily added to custom namespace

###Dependencies

* jQuery 1.5+
* json2.js

###TODO:

* re-consider using CommonJS module pattern instead
* manage individual packages in storage ()
* create sample getText endpoint using node
