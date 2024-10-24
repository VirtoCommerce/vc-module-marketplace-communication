angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.productCommunicationListController',
        ['$scope', 'platformWebApp.bladeUtils', 'platformWebApp.uiGridHelper', 'platformWebApp.ui-grid.extension', 'virtoCommerce.marketplaceCommunicationModule.webApi',
        function ($scope, bladeUtils, uiGridHelper, gridOptionExtension, marketplaceCommunicationApi) {
            $scope.uiGridConstants = uiGridHelper.uiGridConstants;
            var blade = $scope.blade;
            var bladeNavigationService = bladeUtils.bladeNavigationService;

            blade.refresh = function () {
                blade.isLoading = true;
                let searchCriteria = {
                    entityId: blade.entityId,
                    entityType: blade.entityType,
                    sort: 'createdDate:asc'
                }
                marketplaceCommunicationApi.searchMessages(searchCriteria, function (data) {
                    blade.messages = data.results;
                    blade.isLoading = false;
                });
            };

            blade.toolbarCommands = [
            ];

            var setSelectedNode = function (listItem) {
                $scope.selectedNodeId = listItem.id;
            };

            $scope.selectNode = function (listItem) {
                setSelectedNode(listItem);

                $scope.showDetails(listItem);
            }

            $scope.showDetails = function (listItem) {

            };

            $scope.setGridOptions = function (gridId, gridOptions) {
                $scope.gridOptions = gridOptions;
                gridOptionExtension.tryExtendGridOptions(gridId, gridOptions);

                gridOptions.onRegisterApi = function (gridApi) {
                    $scope.gridApi = gridApi;
                };
            };

            blade.refresh();
        }
    ]);
