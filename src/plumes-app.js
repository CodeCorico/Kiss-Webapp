(function() {
  'use strict';

  var App = function(plumes, $app) {

    window.EventsManager.call(this);

    var _this = this,
        _name = $app.attr('plumes') || null,
        _index = $app.attr('index') || null,
        _isReady = false,
        _onReadyFunctions = [],
        _DOMposition = 0,
        _page = null;

    if(!_name) {
      console.error('Error: App format needs to have "plumes" not empty attribute.');
      return false;
    }

    this.name = function() {
      return _name;
    };

    function _ready() {
      setTimeout(function() {
        for(var i = 0; i < _onReadyFunctions.length; i++) {
          _onReadyFunctions[i]();
        }

        if(_index && _this[_index] && _this[_index].name) {
          return _this.open(_index);
        }
      });
    }

    function _collectPages() {
      $app.find('[pl-page]').each(function() {
        var $this = $(this),
            page = new plumes.Page(plumes, _this, $this);

        if(page) {
          var pageName = page.name();

          if(_this[pageName]) {
            console.error('Error: "' + pageName + '" word reserved for Page name.');
            return;
          }

          _this[pageName] = page;
        }
      });

      _ready();
    }

    this.init = function() {
      _collectPages();

      _DOMposition = $app.children().length;
    };

    this.ready = function(func) {
      if(_isReady) {
        func.call(this);
        return;
      }

      _onReadyFunctions.push(func);
    };

    function _clearDOM() {
      var i = 0;
      $app.children().each(function() {
        if(i >= _DOMposition) {
          $(this).remove();
        }
        i++;
      });
    }

    this.open = function(pageName, collection, callback) {
      collection = collection || {};

      if(!_this[pageName] || !_this[pageName].name) {
        console.error('Error: "' + pageName + '" is not a page of ' + _name + '.');
        return false;
      }

      if(_page) {
        _this[_page].destroy();
      }

      _page = pageName;
      _clearDOM();

      var page = _this[_page];

      page.compile(function() {
        page.link(collection, function($dom) {
          $app.append($dom);

          if(callback) {
            callback();
          }
        });
      });
    };

    this.pageActive = function() {
      return _page;
    };

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.App = App;
})();