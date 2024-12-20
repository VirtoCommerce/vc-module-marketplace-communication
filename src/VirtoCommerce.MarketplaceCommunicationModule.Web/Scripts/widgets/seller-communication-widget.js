angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.sellerCommunicationWidgetController',
        ['$scope', 'platformWebApp.bladeNavigationService',
            'virtoCommerce.marketplaceCommunicationModule.webApi',
            function ($scope, bladeNavigationService,
                communicationApi) {
            var blade = $scope.widget.blade;
            $scope.openBlade = function () {
                communicationApi.getOperator({}, function (operatorCommunicationUser) {
                    var operatorCommunicationUserId = operatorCommunicationUser.id;
                    var sellerId = blade.currentEntity.id;
                    if (sellerId) {
                        communicationApi.getOrCreateUser({ userId: sellerId, userType: 'Organization' }, function (sellerCommunicationUser) {
                            var sellerCommunicationUserId = sellerCommunicationUser.id;
                            communicationApi.getOrCreateConversation({
                                userIds: [operatorCommunicationUserId, sellerCommunicationUserId],
                                iconUrl: blade.currentEntity.logo,
                            }, function (conversation) {
                                var newBlade = {
                                    id: 'conversationCommunication',
                                    title: blade.currentEntity.name,
                                    conversationId: conversation.id,
                                    conversation: conversation,
                                    controller: 'virtoCommerce.marketplaceCommunicationModule.messageListController',
                                    template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/message-list.tpl.html'
                                };
                                bladeNavigationService.showBlade(newBlade, blade);
                            })
                        });
                    }
                });
            };
    }]);
