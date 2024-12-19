angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.entitySelectListController', ['$scope',
        'platformWebApp.bladeUtils', 'platformWebApp.bladeNavigationService',
        'platformWebApp.metaFormsService',
        'virtoCommerce.marketplaceCommunicationModule.entityTypesResolverService',
        'virtoCommerce.marketplaceCommunicationModule.webApi',
        'platformWebApp.uiGridHelper', 'platformWebApp.ui-grid.extension',
        function ($scope,
            bladeUtils, bladeNavigationService,
            metaFormsService,
            entityTypesResolverService,
            communicationApi,
            uiGridHelper, gridOptionExtension) {
            $scope.uiGridConstants = uiGridHelper.uiGridConstants;

            var blade = $scope.blade;
            blade.headIcon = 'fas fa-comment';
            blade.title = 'marketplaceCommunication.blades.entity-select-list.title';
            $scope.hasMore = true;
            var filter = blade.filter = $scope.filter = {};
            var searchEndpoint = undefined;
            var entityImageFieldName = undefined;
            var entityNameFieldName = undefined;
            var entityInfoFieldName = undefined;
            var sellerIdFieldName = undefined;

            blade.refresh = function () {
                blade.isLoading = true;
                $scope.listEntries = [];

                if ($scope.pageSettings.currentPage !== 1)
                    $scope.pageSettings.currentPage = 1;

                var searchCriteria = getSearchCriteria();

                if (blade.searchCriteria) {
                    angular.extend(searchCriteria, blade.searchCriteria);
                }

                var entityTemplate = entityTypesResolverService.resolve(blade.entityType);
                if (entityTemplate) {
                    searchEndpoint = entityTemplate.searchEntities;
                    entityImageFieldName = entityTemplate.entityImageFieldName;
                    entityNameFieldName = entityTemplate.entityNameFieldName;
                    entityInfoFieldName = entityTemplate.entityInfoFieldName;
                    sellerIdFieldName = entityTemplate.sellerIdFieldName;
                }

                if (searchEndpoint) {
                    searchEndpoint(searchCriteria, function (result) {
                        transformFields(result.results);
                        $scope.listEntries = result.results;
                        //$scope.pageSettings.totalItems = result.totalCount;
                        blade.isLoading = false;
                    });
                }

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
                }
            ];

            var setSelectedItem = function (listItem) {
                $scope.selectedNodeId = listItem.id;
                blade.selectedItem = listItem;
            };

            $scope.selectItem = function (e, listItem) {
                setSelectedItem(listItem);
                $scope.showMessages(listItem);
            }

            $scope.showMessages = function (listItem) {
                communicationApi.getOperator({}, function (operatorCommunicationUser) {
                    var operatorCommunicationUserId = operatorCommunicationUser.id;
                    var sellerId = listItem[sellerIdFieldName];
                    if (sellerId) {
                        var needSendEntity = blade.entityType != 'VirtoCommerce.MarketplaceVendorModule.Core.Domains.Seller';
                        communicationApi.getOrCreateUser({ userId: sellerId, userType: 'Organization' }, function (sellerCommunicationUser) {
                            var sellerCommunicationUserId = sellerCommunicationUser.id;
                            communicationApi.getOrCreateConversation({
                                userIds: [operatorCommunicationUserId, sellerCommunicationUserId],
                                name: needSendEntity ? listItem.name : null,
                                iconUrl: listItem.iconUrl,
                                entityId: needSendEntity ? listItem.id : null,
                                entityType: needSendEntity ? blade.entityType : null
                            }, function (conversation) {
                                var newBlade = {
                                    id: 'conversationCommunication',
                                    title: listItem.name,
                                    entityId: needSendEntity ? listItem.id : null,
                                    entityType: needSendEntity ? blade.entityType : null,
                                    conversationId: conversation.id,
                                    conversation: conversation,
                                    controller: 'virtoCommerce.marketplaceCommunicationModule.messageListController',
                                    template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/message-list.tpl.html'
                                };
                                blade.childBlade = newBlade;
                                bladeNavigationService.showBlade(newBlade, blade);
                            })
                        });
                    }
                });
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
                    sort: uiGridHelper.getSortExpression($scope),
                    keyword: filter.keyword,
                    skip: ($scope.pageSettings.currentPage - 1) * $scope.pageSettings.itemsPerPageCount,
                    take: $scope.pageSettings.itemsPerPageCount
                };
                return searchCriteria;
            }

            function transformFields(items) {
                if (entityImageFieldName) {
                    items.forEach(x => x.iconUrl = x[entityImageFieldName]);
                }
                if (entityNameFieldName) {
                    items.forEach(x => x.name = x[entityNameFieldName]);
                }
                if (entityInfoFieldName) {
                    items.forEach(x => x.info = x[entityInfoFieldName]);
                }
            }

            function showMore() {
                if ($scope.hasMore) {

                    ++$scope.pageSettings.currentPage;
                    $scope.gridApi.infiniteScroll.saveScrollPercentage();
                    blade.isLoading = true;

                    var searchCriteria = getSearchCriteria();
                    if (searchEndpoint) {
                        searchEndpoint(searchCriteria, function (result) {
                            transformFields(result.results);
                            //$scope.pageSettings.totalItems = result.totalCount;
                            $scope.listEntries = $scope.listEntries.concat(result.results);
                            $scope.hasMore = result.results.length === $scope.pageSettings.itemsPerPageCount;
                            $scope.gridApi.infiniteScroll.dataLoaded();
                            blade.isLoading = false;
                            });
                    }
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

                    uiGridHelper.bindRefreshOnSortChanged($scope);
                    $scope.gridApi.infiniteScroll.on.needLoadMoreData($scope, showMore);
                });
                $scope.$watch('blade.filter.showUnread', blade.refresh);
            };

            //blade.refresh();
        }
    ]);
