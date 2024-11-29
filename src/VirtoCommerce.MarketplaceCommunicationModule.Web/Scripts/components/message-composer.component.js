angular.module('virtoCommerce.marketplaceCommunicationModule').component('messageComposer', {
    templateUrl: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/components/message-composer.tpl.html',
    bindings: {
        isExpanded: '=',
        message: '=',
        isLoading: '=',
        onSend: '&',
        onCancel: '&',
        onExpand: '&'
    },
    controller: ['$scope', function($scope) {
        var $ctrl = this;

        $scope.isExpanded = $ctrl.isExpanded;
        $scope.message = $ctrl.message;
        $scope.isLoading = $ctrl.isLoading;
        $scope.onSend = $ctrl.onSend;
        $scope.onCancel = $ctrl.onCancel;
        $scope.onExpand = $ctrl.onExpand;
    }]
});
