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

        $ctrl.handleKeyPress = function(event) {
            if (event.keyCode === 13 && !event.shiftKey) {
                event.preventDefault();
                if ($ctrl.message && !$ctrl.isLoading) {
                    $ctrl.onSend();
                }
            }
        };

        $scope.isExpanded = $ctrl.isExpanded;
        $scope.message = $ctrl.message;
        $scope.isLoading = $ctrl.isLoading;
        $scope.onSend = $ctrl.onSend;
        $scope.onCancel = $ctrl.onCancel;
        $scope.onExpand = $ctrl.onExpand;
    }]
});
