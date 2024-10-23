angular.module('MarketplaceCommunicationModule')
    .factory('MarketplaceCommunicationModule.webApi', ['$resource', function ($resource) {
        return $resource('api/marketplace-communication-module');
    }]);
