angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.offerCommunicationWidgetController',
    ['$scope', 'platformWebApp.bladeNavigationService',
        function ($scope, bladeNavigationService) {
            var blade = $scope.widget.blade;
            $scope.openBlade = function () {
                var newBlade = {
                    id: 'offerCommunication',
                    entityId: $scope.blade.currentEntity.id,
                    entityType: 'VirtoCommerce.MarketplaceVendorModule.Core.Domains.Offer',
                    controller: 'virtoCommerce.marketplaceCommunicationModule.entityCommunicationListController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/entity-communication-list.tpl.html'
                };
                bladeNavigationService.showBlade(newBlade, blade);
            };
    }]);
