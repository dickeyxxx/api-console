(function() {
  /* jshint camelcase: false */
  'use strict';

  function tokenConstructorFor(scheme) {
    var describedBy = scheme.describedBy || {},
        queryParameters = describedBy.queryParameters || {};

    if (queryParameters.access_token) {
      return Oauth2.QueryParameterToken;
    }

    return Oauth2.HeaderToken;
  }

  var WINDOW_NAME = 'raml-console-oauth2';

  var Oauth2 = function(scheme, credentials) {
    this.scheme = scheme;
    this.credentialsManager = Oauth2.credentialsManager(credentials);
  };

  Oauth2.prototype.authenticate = function() {
    var authorizationRequest = Oauth2.authorizationRequest(this.scheme, this.credentialsManager);
    var accessTokenRequest = Oauth2.accessTokenRequest(this.scheme, this.credentialsManager);

    return authorizationRequest.then(accessTokenRequest);
  };

  Oauth2.credentialsManager = function(credentials) {
    return {
      authorizationUrl : function(baseUrl) {
        return baseUrl +
          '?client_id=' + credentials.clientId +
          '&response_type=code' +
          '&redirect_uri=' + RAML.Settings.oauth2RedirectUri;
      },

      accessTokenParameters: function(code) {
        return {
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: RAML.Settings.oauth2RedirectUri
        };
      }
    };
  };

  Oauth2.authorizationRequest = function(scheme, credentialsManager) {
    var settings = scheme.settings;
    var authorizationUrl = credentialsManager.authorizationUrl(settings.authorizationUri);
    window.open(authorizationUrl, WINDOW_NAME);

    var deferred = $.Deferred();
    window.RAML.authorizationSuccess = function(code) { deferred.resolve(code); };
    return deferred.promise();
  };

  Oauth2.accessTokenRequest = function(scheme, credentialsManager) {
    var settings = scheme.settings;
    var TokenConstructor = tokenConstructorFor(scheme);
    return function(code) {
      var url = settings.accessTokenUri;
      if (RAML.Settings.proxy) {
        url = RAML.Settings.proxy + url;
      }

      var requestOptions = {
        url: url,
        type: 'post',
        data: credentialsManager.accessTokenParameters(code)
      };

      var createToken = function(data) {
        return new TokenConstructor(data.access_token);
      };
      return $.ajax(requestOptions).then(createToken);
    };
  };

  Oauth2.QueryParameterToken = function(token) {
    this.accessToken = token;
  };

  Oauth2.QueryParameterToken.prototype.sign = function(request) {
    request.queryParam('access_token', this.accessToken);
  };

  Oauth2.HeaderToken = function(token) {
    this.accessToken = token;
  };

  Oauth2.HeaderToken.prototype.sign = function(request) {
    request.header('Authorization', 'Bearer ' + this.accessToken);
  };

  RAML.Client.AuthStrategies.Oauth2 = Oauth2;
})();
