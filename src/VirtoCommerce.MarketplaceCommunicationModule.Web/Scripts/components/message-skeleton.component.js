angular.module('virtoCommerce.marketplaceCommunicationModule').component('messageSkeleton', {
    templateUrl: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/components/message-skeleton.tpl.html',
    bindings: {
        count: '='
    },
    controller: ['$scope', function($scope) {
        var $ctrl = this;

        $ctrl.getCount = function() {
            return new Array($ctrl.count || 1);
        };

        $scope.getCount = $ctrl.getCount;
    }]
});
