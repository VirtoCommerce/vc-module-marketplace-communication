angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.conversationListController', ['$scope', 'platformWebApp.bladeUtils', 'platformWebApp.bladeNavigationService', 'virtoCommerce.marketplaceCommunicationModule.webApi', 'platformWebApp.uiGridHelper', 'platformWebApp.ui-grid.extension',
        function ($scope, bladeUtils, bladeNavigationService, communicationApi, uiGridHelper, gridOptionExtension) {
            $scope.uiGridConstants = uiGridHelper.uiGridConstants;

            var blade = $scope.blade;
            blade.headIcon = 'fas fa-comment';
            blade.title = 'marketplaceCommunication.blades.conversations.title';
            blade.userIds = [];
            $scope.userName = '';

            blade.refresh = function () {
                blade.isLoading = true;

                communicationApi.getOperator(function (operator) {
                    blade.userIds = [operator.id];
                    $scope.userName = operator.userName;

                    var searchCriteria = getSearchCriteria();

                    if (blade.searchCriteria) {
                        angular.extend(searchCriteria, blade.searchCriteria);
                    }

                    communicationApi.searchConversations(searchCriteria, function (data) {
                        blade.isLoading = false;

                        $scope.listEntries = [];
                        blade.selectedItem = undefined;

                        if (data.results) {
                            $scope.listEntries = data.results;
                            if ($scope.selectedNodeId) {
                                blade.selectedItem = $scope.listEntries.filter(x => x.id === $scope.selectedNodeId).find(o => true);
                            }
                        }

                        if (blade.childBlade && blade.selectedItem) {
                            blade.childBlade.currentEntity = blade.selectedItem;
                            blade.childBlade.refresh();
                        }
                    });
                });
            };

            blade.toolbarCommands = [
                {
                    name: "platform.commands.refresh", icon: 'fa fa-refresh',
                    executeMethod: blade.refresh,
                    canExecuteMethod: function () {
                        return true;
                    }
                },
                {
                    name: "platform.commands.add", icon: 'fas fa-plus',
                    executeMethod: function () {
                        $scope.showDetails(undefined, true);
                    },
                    canExecuteMethod: function () {
                        return false;
                    }
                }
            ];

            var setSelectedNode = function (listItem) {
                $scope.selectedNodeId = listItem.id;
                blade.selectedItem = listItem;
            };

            $scope.selectNode = function (listItem) {
                setSelectedNode(listItem);

                $scope.showDetails(listItem);
            }

            $scope.showDetails = function (listItem, isNew) {
                var newBlade = {
                    id: 'conversationCommunication',
                    title: listItem.name,
                    entityId: listItem.entityId,
                    entityType: listItem.entityType,
                    conversationId: listItem.id,
                    conversation: listItem,
                    controller: 'virtoCommerce.marketplaceCommunicationModule.messageListController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/message-list.tpl.html'
                };
                blade.childBlade = newBlade;
                bladeNavigationService.showBlade(newBlade, blade);
            }

            function getSearchCriteria() {
                var searchCriteria = {
                    userIds: blade.userIds,
                    responseGroup: 'Full'
                };
                return searchCriteria;
            }

            blade.refresh();
        }
    ]);
