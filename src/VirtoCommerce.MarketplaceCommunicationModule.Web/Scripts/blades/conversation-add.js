angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.conversationAddController',
        ['$scope', 'platformWebApp.bladeNavigationService', 'virtoCommerce.marketplaceCommunicationModule.entityTypesResolverService',
            function ($scope, bladeNavigationService, entityTypesResolverService) {
                var blade = $scope.blade;
                blade.title = 'marketplaceCommunication.blades.conversation-add.title';

                $scope.availableTypes = entityTypesResolverService.objects;

                $scope.addConversation = function (entityType) {
                    var newBlade = {
                        id: 'entitySelectList',
                        entityType: entityType,
                        controller: 'virtoCommerce.marketplaceCommunicationModule.entitySelectListController',
                        template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/entity-select-list.tpl.html'
                    };
                    bladeNavigationService.showBlade(newBlade, blade);
                };

                blade.isLoading = false;
            }
        ]
    );
