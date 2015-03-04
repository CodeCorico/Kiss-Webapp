(function() {
  'use strict';

  var Page = function(plumes, app, $page) {

    var _this = this,
        _name = $page.attr('pl-page'),
        _controllers = [],
        _src = $page.attr('src'),
        _components = [];

    if($page.get(0).tagName.toLowerCase() != 'script' || !_name || !_src) {
      console.error('Error: Page format needs to be SCRIPT node with "pl-page" and "src" attributes.');
      return false;
    }

    plumes.Component.call(this, plumes, app, this, $page);

    this.templateSrc(_src);

    this.name = function() {
      return _name;
    };

    this.controller = function(func) {
      _controllers.push(func);
      _this.controllers(_controllers);
    };

    this.beforeNav = function(page, func) {
      _this.on('nav.nav-' + page, function(args) {
        func.call(this, args.collection, args.callback);
        return true;
      });
    };

    this.registerComponent = function(component) {
      _components.push(component);
    };

    this.on('linked', function() {
      $.each(_components, function() {
        this.link();
      });
    });

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.Page = Page;
})();