(function() {
  'use strict';

  window.Plumes.theme('android');
})();

window.Plumes.ready(function() {
  'use strict';

  this.component('another-robot', function(next) {

    this.collection('img', 'http://cyborg.namedecoder.com/webimages/edox-ANDROID.png');

    next();
  });

});