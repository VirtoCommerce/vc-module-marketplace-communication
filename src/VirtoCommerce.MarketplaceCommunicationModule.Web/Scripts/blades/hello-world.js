angular.module('MarketplaceCommunicationModule')
    .controller('MarketplaceCommunicationModule.helloWorldController', ['$scope', 'MarketplaceCommunicationModule.webApi', function ($scope, api) {
        var blade = $scope.blade;
        blade.title = 'MarketplaceCommunicationModule';

        blade.refresh = function () {
            api.get(function (data) {
                blade.title = 'MarketplaceCommunicationModule.blades.hello-world.title';
                blade.data = data.result;
                blade.isLoading = false;
            });
        };

        blade.refresh();
    }]);
