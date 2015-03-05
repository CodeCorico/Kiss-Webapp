(function() {
  'use strict';

  var List = function(plumes, app, page, component, $list) {

    window.Plumes.Component.call(this);

    var _this = this,
        _activeList = [],
        _components = [],
        _itemTemplate = '',
        _bindingKey = null,
        _bindingItem = null,
        _bindingConverter = null;

    // converters du scope (page ou component)
    // variables du scope (page ou component)
    // destruction de l'element
    // refresh $length

    function _compare(a, b) {
      if(typeof a != typeof b) {
        return false;
      }

      if(typeof a != 'object' && a !== b) {
        return false;
      }

      if(typeof a == 'object' && $.param(a) != $.param(b)) {
        return false;
      }

      return true;
    }

    function _createMissingComponents(count, newList, lengthChanged) {
      var component = new plumes.Component(plumes, app, page, null);
      _components.push(component);

      component.template(_itemTemplate);
      component.compile(function() {
        component.link({}, function($dom) {
          $list.append($dom);

          count--;
          if(count < 1) {
            return _updateList(newList, lengthChanged);
          }
          _createMissingComponents(count, newList, lengthChanged);
        });
      });

    }

    function _deleteComponents(count, newList, lengthChanged) {
      for(var i = 0; i < count; i++) {
        var component = _components.pop();
        component.destroy();
        $list.children().last().remove();
      }

      _updateList(newList, lengthChanged);
    }

    function _updateList(newList, lengthChanged) {
      newList = newList || [];
      lengthChanged = typeof lengthChanged == 'undefined' ? newList.length != _components.length : lengthChanged;

      if(newList.length > _components.length) {
        return _createMissingComponents(newList.length - _components.length, newList, lengthChanged);
      }
      if(newList.length < _components.length) {
        return _deleteComponents(_components.length - newList.length, newList, lengthChanged);
      }

      $.each(newList, function(i) {
        var component = _components[i];

        if(lengthChanged) {
          component.collection('$length', newList.length);
        }
        if(component.collection('$index') != i) {
          component.collection('$index', i);
        }

        var item = component.collection(_bindingItem);
        if(!_compare(this, item)) {
          component.collection(_bindingItem, plumes.extendEverything(this));
        }
      });
    }

    this.compile = function() {
      var attr = $list.attr('pl-list').split(' in ');

      _bindingItem = attr[0];

      _bindingConverter = attr[1].split(':');
      _bindingKey = _bindingConverter[0];
      _bindingConverter = _bindingConverter.length > 1 ? _bindingConverter[1] : null;

      _itemTemplate = $list
        .html()
        .replace(/({{(.*?)}})/g, '<span pl-value="$2"></span>');
      $list.html('');

      component.registerList(_this);
    };

    this.link = function() {
      component.bind(_bindingKey, function(value) {
        if(_bindingConverter) {
          value = _this.convert(_bindingConverter, value || []);
        }

        _updateList(value);
      });

      _updateList(component.collection(_bindingKey));
    };

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.List = List;
})();