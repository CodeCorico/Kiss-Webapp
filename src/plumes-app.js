(function() {
  'use strict';

  var App = function(plumes, $app) {

    window.EventsManager.call(this);

    var _this = this,
        _name = $app.attr('plumes') || null,
        _index = $app.attr('index') || null,
        _isReady = false,
        _pagesReady = 0,
        _pagesCount = 0,
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
      _pagesReady++;
      if(_pagesReady >= _pagesCount) {
        _isReady = true;

        for(var i = 0; i < _onReadyFunctions.length; i++) {
          _onReadyFunctions[i]();
        }

        if(_index && _this[_index] && _this[_index].name) {
          return _this.open(_index);
        }
      }
    }

    function _collectPages() {
      $app.find('[pl-page]').each(function() {
        var $this = $(this);
        var page = new plumes.Page(plumes, _this, $this);
        if(page) {
          var pageName = page.name();

          if(_this[pageName]) {
            console.error('Error: "' + pageName + '" word reserved for Page name.');
            return;
          }

          page.ready(function() {
            _ready();
          });
          _this[pageName] = page;
          _pagesCount++;
          page.init();
        }
      });
    }

    this.init = function() {
      _collectPages();

      _DOMposition = $app.children().length;
    };

    this.ready = function(func) {
      if(_isReady) {
        func();
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

    this.open = function(pageName, callback) {
      if(!_this[pageName] || !_this[pageName].name) {
        console.error('Error: "' + pageName + '" is not a page of ' + _name + '.');
        return false;
      }

      if(_page) {
        _this[_page].clear();
      }

      _page = pageName;
      _clearDOM();
      $app.append(_this[_page].compile());

      _this[_page].createDOM($app.children()[_DOMposition], callback);
    };

    this.pageActive = function() {
      return _page;
    };

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.App = App;
})();