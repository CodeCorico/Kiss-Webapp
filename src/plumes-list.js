(function() {
  'use strict';

  var List = function(plumes, app, page, component, $list) {

    window.Plumes.Component.call(this);

    var _this = this,
        _components = [],
        _itemTemplate = '',
        _bindingParent = [],
        _bindingKey = null,
        _bindingItem = null,
        _bindingConverter = null;

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

    function _applyCollectionParent(key, value) {
      $.each(_components, function() {
        this.collection(key, plumes.extendEverything(value));
      });
    }

    function _bindParent(keys) {
      $.each(keys, function() {
        var key = this;
        if(key != '$index' && key != '$length' && key != _bindingItem) {
          if($.inArray(key, _bindingParent) < 0) {
            _bindingParent.push(key);

            component.bind(key, function(value) {
              _applyCollectionParent(key, value);
            });
          }

          _applyCollectionParent(key, plumes.extendEverything(component.collection(key)));
        }
      });
    }

    function _createMissingComponents(count, newList, lengthChanged) {
      var component = new plumes.Component(plumes, app, page, null);
      _components.push(component);

      component.template(_itemTemplate);
      component.compile(function() {
        component.link({}, function($dom) {
          $list.append($dom);

          _bindParent(component.keysBinded());

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
          value = component.convert(_bindingConverter, value || []);
        }

        _updateList(value);
      });

      var value = component.collection(_bindingKey);
      if(_bindingConverter) {
        value = component.convert(_bindingConverter, value || []);
      }

      _updateList(value);
    };

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.List = List;
})();