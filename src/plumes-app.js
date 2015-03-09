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
        _page = null,
        _historyEnabled = $app.attr('history') || null,
        _history = [];

    _historyEnabled = _historyEnabled && _historyEnabled == 'false' ? false : true;

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

    function _watchHistory() {
      if(_historyEnabled) {
        plumes.on('hashChanged', function(args) {
          args.hash = parseInt(args.hash || 0, 10);

          var lastHistoryIndex = _history.length ? _history.length - 1 : null,
              hashHistory = _history[args.hash];

          if(lastHistoryIndex != args.hash && hashHistory) {
            while(_history.length > args.hash + 1) {
              _history.pop();
            }

            _this.open(hashHistory.page, $.extend(true, {}, hashHistory.collection), false);
          }
        });
      }
    }

    this.init = function() {
      _collectPages();
      _watchHistory();

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
      $app.children().each(function(i) {
        if(i >= _DOMposition) {
          $(this).remove();
        }
      });
    }

    this.open = function(pageName, collection, updateHistory, callback) {
      collection = collection || {};
      updateHistory = typeof updateHistory == 'undefined' ? true : updateHistory;

      if(!_this[pageName] || !_this[pageName].name) {
        console.error('Error: "' + pageName + '" is not a page of ' + _name + '.');
        return false;
      }

      var previousPage = _page ? _page : null;

      _page = pageName;

      var page = _this[_page];

      page.compile(function() {
        page.referer(previousPage, collection);

        if(_historyEnabled && updateHistory) {
          _history.push({
            page: _page,
            collection: $.extend(true, {}, collection)
          });

          window.location.hash = _history.length === 1 ? '' : _history.length - 1;
        }

        page.link(collection, function($dom) {
          if(previousPage) {
            _this[previousPage].destroy();
          }
          _clearDOM();
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