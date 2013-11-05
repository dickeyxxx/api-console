(function() {
  'use strict';

  RAML.Directives.namedParametersDocumentation = function() {
    return {
      restrict: 'E',
      templateUrl: 'views/named_parameters_documentation.tmpl.html',
      replace: true,
      scope: {
        heading: '@',
        parameters: '='
      }
    };
  };
})();
