angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.productCommunicationWidgetController',
    ['$scope', 'platformWebApp.bladeNavigationService',
        function ($scope, bladeNavigationService) {
            var blade = $scope.widget.blade;
            $scope.openBlade = function () {
                var newBlade = {
                    id: 'productCommunication',
                    entityId: $scope.blade.currentEntity.id,
                    entityType: 'VirtoCommerce.MarketplaceVendorModule.Core.Domains.SellerProduct',
                    controller: 'virtoCommerce.marketplaceCommunicationModule.entityCommunicationListController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/entity-communication-list.tpl.html'
                };
                bladeNavigationService.showBlade(newBlade, blade);
            };
    }]);