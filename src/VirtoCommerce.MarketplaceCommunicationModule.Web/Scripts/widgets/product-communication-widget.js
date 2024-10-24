angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.productCommunicationWidgetController',
    ['$scope', 'platformWebApp.bladeNavigationService',
        function ($scope, bladeNavigationService) {
            var blade = $scope.widget.blade;
            $scope.openBlade = function () {
                var newBlade = {
                    id: 'productCommunication',
                    entityId: $scope.blade.currentEntity.id,
                    entityType: 'Product',
                    controller: 'virtoCommerce.marketplaceCommunicationModule.productCommunicationListController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/product-communication-list.tpl.html'
                };
                bladeNavigationService.showBlade(newBlade, blade);
            };
    }]);
