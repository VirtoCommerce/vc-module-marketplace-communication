// Call this to register your module to main application
var moduleName = 'virtoCommerce.marketplaceCommunicationModule';

if (AppDependencies !== undefined) {
    AppDependencies.push(moduleName);
}

angular.module(moduleName, [])
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('workspace.communication', {
                    url: '/communication',
                    templateUrl: '$(Platform)/Scripts/common/templates/home.tpl.html',
                    controller: [
                        'platformWebApp.bladeNavigationService',
                        function (bladeNavigationService) {
                            var newBlade = {
                                id: 'communicationList',
                                controller: 'virtoCommerce.marketplaceCommunicationModule.conversationListController',
                                template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/conversation-list.tpl.html',
                                isClosingDisabled: true,
                            };
                            bladeNavigationService.showBlade(newBlade);
                        }
                    ]
                });
        }
    ])
    .run(['platformWebApp.mainMenuService', '$state', 'platformWebApp.widgetService',
        function (mainMenuService, $state, widgetService) {
            //Register module in main menu
            var menuItem = {
                path: 'browse/communication',
                icon: 'fas fa-comment',
                title: 'marketplaceCommunication.main-menu-title',
                priority: 100,
                action: function () { $state.go('workspace.communication'); },
                permission: 'seller:message:read',
            };
            mainMenuService.addMenuItem(menuItem);

            // Seller product details: communication widget
            var productCommunicationWidget = {
                controller: 'virtoCommerce.marketplaceCommunicationModule.productCommunicationWidgetController',
                template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/widgets/product-communication-widget.tpl.html'
            };
            widgetService.registerWidget(productCommunicationWidget, 'sellerProductDetailsWidgetContainer');

            // Order details: communication widget
            var orderCommunicationWidget = {
                controller: 'virtoCommerce.marketplaceCommunicationModule.orderCommunicationWidgetController',
                template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/widgets/order-communication-widget.tpl.html'
            };
            widgetService.registerWidget(orderCommunicationWidget, 'customerOrderDetailWidgets');

            // Offer details: communication widget
            var offerCommunicationWidget = {
                controller: 'virtoCommerce.marketplaceCommunicationModule.offerCommunicationWidgetController',
                template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/widgets/order-communication-widget.tpl.html'
            };
            widgetService.registerWidget(offerCommunicationWidget, 'offerDetailsWidgetContainer');
        }
    ]);
