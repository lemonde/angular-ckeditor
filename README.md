# angular-ckeditor

CKEditor directive for Angular.

## Install

### Using bower

```sh
bower install angular-ckeditor
```

## Usage

HTML:

```html
<!-- Load files. -->
<script src="angular.js"></script>
<script src="angular-draganddrop.js"></script>

<div ng-controller="CkeditorCtrl">
  <div ckeditor="options" ng-model="content" ready="onReady()"></div>
</div>
```

JavaScript:

```js
angular.module('controllers.ckeditor', ['ckeditor'])
.controller('CkeditorCtrl', function ($scope) {

  // Editor options.
  $scope.options = {
    language: 'en',
    allowedContent: true,
    entities: false
  };

  // Called when the editor is completely ready.
  $scope.onReady = function () {
    // ...
  };
});
```

### "ckeditor" directive

- "ckeditor" Specify editor options. Accepts an Object.
- "ng-model" Binded scope variable.
- "ready" Called when the editor is completely ready. Accepts an Angular expression.

## License

MIT