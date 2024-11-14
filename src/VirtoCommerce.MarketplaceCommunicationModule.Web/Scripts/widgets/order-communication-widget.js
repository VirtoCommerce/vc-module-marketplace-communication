angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.orderCommunicationWidgetController',
    ['$scope', 'platformWebApp.bladeNavigationService',
        function ($scope, bladeNavigationService) {
            var blade = $scope.widget.blade;

            $scope.isDisabled = function () {
                return $scope.blade.currentEntity.employeeId === null;
            }

            $scope.openBlade = function () {
                var newBlade = {
                    id: 'orderCommunication',
                    entityId: $scope.blade.currentEntity.id,
                    entityType: 'VirtoCommerce.OrdersModule.Core.Model.CustomerOrder',
                    controller: 'virtoCommerce.marketplaceCommunicationModule.entityCommunicationListController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/entity-communication-list.tpl.html'
                };
                bladeNavigationService.showBlade(newBlade, blade);
            };
    }]);
