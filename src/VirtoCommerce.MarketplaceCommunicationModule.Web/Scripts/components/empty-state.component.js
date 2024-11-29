angular.module('virtoCommerce.marketplaceCommunicationModule').component('emptyState', {
    templateUrl: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/components/empty-state.tpl.html',
    bindings: {
        onStart: '&'
    },
    controller: ['$scope', function($scope) {
        var $ctrl = this;

        $scope.onStart = $ctrl.onStart;
    }]  
});
