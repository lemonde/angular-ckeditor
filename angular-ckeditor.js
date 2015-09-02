(function (root, factory) {
  // AMD
  if (typeof define === 'function' && define.amd) define(['angular'], factory);
  // Global
  else factory(angular);
}(this, function (angular) {

  angular
  .module('ckeditor', [])
  .directive('ckeditor', ['$parse', '$q', ckeditorDirective]);

  // Polyfill setImmediate function.
  var setImmediate = window && window.setImmediate ? window.setImmediate : function (fn) {
    setTimeout(fn, 0);
  };

  function createCkEditorInstance(editorElement, config) {
    var instance;
    // Create editor instance.
    if (editorElement.hasAttribute('contenteditable') &&
      editorElement.getAttribute('contenteditable').toLowerCase() == 'true') {
      instance = CKEDITOR.inline(editorElement, config);
    }
    else {
      instance = CKEDITOR.replace(editorElement, config);
    }
    return instance;
  }

  /**
   * CKEditor directive.
   *
   * @example
   * <div ckeditor="options" ng-model="content" ready="onReady()"></div>
   */

  function ckeditorDirective($parse) {
    return {
      restrict: 'A',
      require: ['ckeditor', 'ngModel'],
      controller: [
        '$scope',
        '$element',
        '$attrs',
        '$parse',
        '$q',
        ckeditorController
      ],
      link: function (scope, element, attrs, ctrls) {
        // get needed controllers
        var controller = ctrls[0];
        controller.modelController = ctrls[1];

        var initialiseCkEditor = function () {

          // Sync view on specific events.
          ['dataReady', 'change', 'blur', 'saveSnapshot'].forEach(function (event) {
            controller.onCKEvent(event, function syncView() {
              controller.modelController.$setViewValue(controller.instance.getData() || '');
            });
          });

          controller.instance.setReadOnly(!!attrs.readonly);
          attrs.$observe('readonly', function (readonly) {
            controller.instance.setReadOnly(!!readonly);
          });

          // Defer the ready handler calling to ensure that the editor is
          // completely ready and populated with data.
          setImmediate(function () {
            $parse(attrs.ready)(scope);
          });
        };

        controller.ready().then(function initialize() {
          initialiseCkEditor();
        });

        // Set editor data when view data change.
        controller.modelController.$render = function syncEditor() {
          controller.ready().then(function () {
            controller.instance.setData(controller.modelController.$viewValue || '');
          });
        };

        scope.$on('recreate-ckeditor', function() {
          var config = $parse(attrs.ckeditor)(scope) || {};
          controller.instance = createCkEditorInstance(element[0], config);
          controller.instance.on('instanceReady', function() {
            controller.readyDeferred.resolve(true);
          });
          controller.ready().then(function reinitialise() {
            initialiseCkEditor();
          });
        });

        scope.$on('destroy-ckeditor', function destroy() {
          controller.instance.destroy(false);
          controller.instance = null;
          controller.readyDeferred = $q.defer();
        });
      }
    };
  }

  /**
   * CKEditor controller.
   */

  function ckeditorController($scope, $element, $attrs, $parse, $q) {
    var config = $parse($attrs.ckeditor)($scope) || {};
    var editorElement = $element[0];
    var instance;
    var readyDeferred;
    readyDeferred = this.readyDeferred = $q.defer(); // a deferred to be resolved when the editor is ready

    instance = this.instance = createCkEditorInstance(editorElement, config);

    /**
     * Listen on events of a given type.
     * This make all event asynchronous and wrapped in $scope.$apply.
     *
     * @param {String} event
     * @param {Function} listener
     * @returns {Function} Deregistration function for this listener.
     */

    this.onCKEvent = function (event, listener) {
      this.instance.on(event, asyncListener);

      function asyncListener() {
        var args = arguments;
        setImmediate(function () {
          applyListener.apply(null, args);
        });
      }

      function applyListener() {
        var args = arguments;
        $scope.$apply(function () {
          listener.apply(null, args);
        });
      }

      // Return the deregistration function
      return function $off() {
        instance.removeListener(event, applyListener);
      };
    };

    this.onCKEvent('instanceReady', function () {
      readyDeferred.resolve(true);
    });

    /**
     * Check if the editor if ready.
     *
     * @returns {Promise}
     */
    this.ready = function () {
      return this.readyDeferred.promise;
    };

    // Destroy editor when the scope is destroyed.
    $scope.$on('$destroy', function onDestroy() {
      // do not delete too fast or pending events will throw errors
      readyDeferred.promise.then(function () {
        instance.destroy(false);
      });
    });
  }
}));
