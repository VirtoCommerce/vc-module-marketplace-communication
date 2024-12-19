angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.conversationListController', ['$scope',
        'platformWebApp.bladeUtils', 'platformWebApp.bladeNavigationService',
        'platformWebApp.metaFormsService',
        'virtoCommerce.marketplaceCommunicationModule.webApi',
        'platformWebApp.uiGridHelper', 'platformWebApp.ui-grid.extension',
        function ($scope,
            bladeUtils, bladeNavigationService,
            metaFormsService,
            communicationApi,
            uiGridHelper, gridOptionExtension) {
            $scope.uiGridConstants = uiGridHelper.uiGridConstants;

            var blade = $scope.blade;
            blade.headIcon = 'fas fa-comment';
            blade.title = 'marketplaceCommunication.blades.conversation-list.title';
            blade.userIds = [];
            $scope.userName = '';
            $scope.hasMore = true;
            var filter = blade.filter = $scope.filter = {};
            var notificationConversationId = undefined;
            var notificationMessageId = undefined;
            if (blade.notification) {
                notificationConversationId = blade.notification.conversationId;
                notificationMessageId = blade.notification.messageId;
                blade.notification = null;
            }

            blade.refresh = function (needRefreshChildBlade) {
                blade.isLoading = true;

                if ($scope.pageSettings.currentPage !== 1)
                    $scope.pageSettings.currentPage = 1;

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
                            if (notificationConversationId) {
                                blade.selectedItem = $scope.listEntries.filter(x => x.id === notificationConversationId).find(o => true);
                            }
                            else if ($scope.selectedNodeId) {
                                blade.selectedItem = $scope.listEntries.filter(x => x.id === $scope.selectedNodeId).find(o => true);
                            }
                        }

                        $scope.pageSettings.totalItems = data.totalCount;
                        $scope.hasMore = data.results.length === $scope.pageSettings.itemsPerPageCount;

                        if (blade.childBlade) {
                            if (blade.selectedItem) {
                                blade.childBlade.currentEntity = blade.selectedItem;
                                if (needRefreshChildBlade) {
                                    blade.childBlade.refresh();
                                };
                            }
                        }
                        else if (notificationConversationId) {
                            $scope.showDetails(blade.selectedItem, notificationMessageId);
                        }
                    });
                });

                resetStateGrid();
            };

            blade.toolbarCommands = [
                {
                    name: "platform.commands.refresh", icon: 'fa fa-refresh',
                    executeMethod: function () {
                        blade.refresh(true);
                    },
                    canExecuteMethod: function () {
                        return true;
                    }
                },
                {
                    name: "marketplaceCommunication.blades.conversation-list.commands.new-chat",
                    icon: 'fas fa-plus',
                    executeMethod: function () {
                        $scope.startNew();
                    },
                    canExecuteMethod: function () {
                        return true;
                    }
                }
            ];

            $scope.manageConversation = function (listItem) {
                $scope.selectedNodeId = listItem.id;
                blade.selectedItem = listItem;

                var conversationTemplate = metaFormsService.getMetaFields('Conversation');
                var newBlade = {
                    id: 'conversationManage',
                    title: listItem.name,
                    entityId: listItem.entityId,
                    entityType: listItem.entityType,
                    conversationId: listItem.id,
                    //conversation: listItem,
                    controller: 'virtoCommerce.marketplaceCommunicationModule.conversationDetailsController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/conversation-details.tpl.html',
                    metaFields: conversationTemplate
                };
                blade.childBlade = newBlade;
                bladeNavigationService.showBlade(newBlade, blade);
            }

            var setSelectedItem = function (listItem) {
                $scope.selectedNodeId = listItem.id;
                blade.selectedItem = listItem;
            };

            $scope.selectItem = function (e, listItem) {
                setSelectedItem(listItem);

                $scope.showDetails(listItem);
            }

            $scope.showDetails = function (listItem, exactlyMessageId) {
                var newBlade = {
                    id: 'conversationCommunication',
                    title: listItem.name,
                    entityId: listItem.entityId,
                    entityType: listItem.entityType,
                    conversationId: listItem.id,
                    conversation: listItem,
                    exactlyMessageId: exactlyMessageId,
                    controller: 'virtoCommerce.marketplaceCommunicationModule.messageListController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/message-list.tpl.html'
                };
                blade.childBlade = newBlade;
                bladeNavigationService.showBlade(newBlade, blade);
            }

            $scope.startNew = function () {
                var newBlade = {
                    id: 'conversationAdd',
                    controller: 'virtoCommerce.marketplaceCommunicationModule.conversationAddController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/conversation-add.tpl.html'
                };
                blade.childBlade = newBlade;
                bladeNavigationService.showBlade(newBlade, blade);
            }

            filter.criteriaChanged = function () {
                if ($scope.pageSettings.currentPage > 1) {
                    $scope.pageSettings.currentPage = 1;
                } else {
                    blade.refresh(true);
                }
            };

            function getSearchCriteria() {
                var searchCriteria = {
                    //sort: uiGridHelper.getSortExpression($scope),
                    keyword: filter.keyword,
                    userIds: blade.userIds,
                    responseGroup: 'Full',
                    skip: ($scope.pageSettings.currentPage - 1) * $scope.pageSettings.itemsPerPageCount,
                    take: $scope.pageSettings.itemsPerPageCount
                };
                return searchCriteria;
            }

            function showMore() {
                if ($scope.hasMore) {

                    ++$scope.pageSettings.currentPage;
                    $scope.gridApi.infiniteScroll.saveScrollPercentage();
                    blade.isLoading = true;

                    var searchCriteria = getSearchCriteria();

                    communicationApi.searchConversations(
                        searchCriteria,
                        function (data) {
                            //transformByFilters(data.results);
                            blade.isLoading = false;
                            $scope.pageSettings.totalItems = data.totalCount;
                            $scope.listEntries = $scope.listEntries.concat(data.results);
                            $scope.hasMore = data.results.length === $scope.pageSettings.itemsPerPageCount;
                            $scope.gridApi.infiniteScroll.dataLoaded();
                        });
                }
            }

            function resetStateGrid() {
                if ($scope.gridApi) {
                    $scope.items = [];
//                    $scope.gridApi.selection.clearSelectedRows();
                    $scope.gridApi.infiniteScroll.resetScroll(true, true);
                    $scope.gridApi.infiniteScroll.dataLoaded();
                }
            }

            $scope.setGridOptions = function (gridOptions) {
                bladeUtils.initializePagination($scope, true);

                $scope.pageSettings.itemsPerPageCount = 30;

                uiGridHelper.initialize($scope, gridOptions, function (gridApi) {
                    $scope.gridApi = gridApi;

                    //uiGridHelper.bindRefreshOnSortChanged($scope);
                    $scope.gridApi.infiniteScroll.on.needLoadMoreData($scope, showMore);
                });
                $scope.$watch('blade.filter.showUnread', blade.refresh);
            };

            //blade.refresh();
        }
    ]);
