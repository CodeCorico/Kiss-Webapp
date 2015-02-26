$(function() {
  'use strict';

  var Page = function($page) {
    var _this = this,
        _isReady = false,
        _onReadyFunctions = [],
        _name = $page.attr('page'),
        _src = $page.attr('src');

    if($page.get(0).tagName.toLowerCase() != 'script' || !_name || !_src) {
      console.error('Error: Page format needs to be SCRIPT node with "page" and "src" attributes.');
      return false;
    }

    this.name = function() {
      return _name;
    };

    this.src = function() {
      return _src;
    };

    function _ready() {
      _isReady = true;

      for(var i = 0; i < _onReadyFunctions.length; i++) {
        _onReadyFunctions[i]();
      }
    }

    this.ready = function(func) {
      if(_isReady) {
        func();
        return;
      }

      _onReadyFunctions.push(func);
    };

    this.init = function() {
      $page.load(_src, function() {
        _ready();
      });
    };

  };

  var App = function($app) {

    var _this = this,
        _name = $app.attr('plumes') || null,
        _isReady = false,
        _pagesReady = 0,
        _pagesCount = 0,
        _onReadyFunctions = [];

    if(!_name) {
      console.error('Error: App format needs to have "plumes" not empty attribute.');
      return false;
    }

    this.Pages = {};

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
      }
    }

    function _collectPages() {
      $app.find('[page]').each(function() {
        var $this = $(this);
        var page = new Page($this);
        if(page) {
          page.ready(function() {
            _ready();
          });
          _this.Pages[page.name()] = page;
          _pagesCount++;
          page.init();
        }
      });
    }

    this.init = function() {
      _collectPages();
    };

    this.ready = function(func) {
      if(_isReady) {
        func();
        return;
      }

      _onReadyFunctions.push(func);
    };

  };

  var Plumes = function() {

    var _this = this,
        _isReady = false,
        _appsReady = 0,
        _appsCount = 0,
        _onReadyFunctions = [];

    _this.Apps = {};

    function _ready() {
      _appsReady++;
      if(_appsReady >= _appsCount) {
        _isReady = true;

        for(var i = 0; i < _onReadyFunctions.length; i++) {
          _onReadyFunctions[i]();
        }
      }
    }

    this.init = function() {
      $('[plumes]').each(function() {
        var app = new App($(this));
        if(app) {
          app.ready(function() {
            _ready();
          });

          _this.Apps[app.name()] = app;
          _appsCount++;
          app.init();
        }
      });
    };

    this.ready = function(func) {
      if(_isReady) {
        func();
        return;
      }

      _onReadyFunctions.push(func);
    };
  };

  window.Plumes = new Plumes();

  window.Plumes.init();
});