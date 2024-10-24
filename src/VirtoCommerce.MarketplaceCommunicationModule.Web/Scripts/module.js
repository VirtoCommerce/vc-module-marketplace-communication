// Call this to register your module to main application
var moduleName = 'virtoCommerce.marketplaceCommunicationModule';

if (AppDependencies !== undefined) {
    AppDependencies.push(moduleName);
}

angular.module(moduleName, [])
    .config(['$stateProvider',
        function ($stateProvider) {
        //    $stateProvider
        //        .state('workspace.MarketplaceCommunicationModuleState', {
        //            url: '/MarketplaceCommunicationModule',
        //            templateUrl: '$(Platform)/Scripts/common/templates/home.tpl.html',
        //            controller: [
        //                'platformWebApp.bladeNavigationService',
        //                function (bladeNavigationService) {
        //                    var newBlade = {
        //                        id: 'blade1',
        //                        controller: 'MarketplaceCommunicationModule.helloWorldController',
        //                        template: 'Modules/$(VirtoCommerce.MarketplaceCommunicationModule)/Scripts/blades/hello-world.html',
        //                        isClosingDisabled: true,
        //                    };
        //                    bladeNavigationService.showBlade(newBlade);
        //                }
        //            ]
        //        });
        }
    ])
    .run(['platformWebApp.mainMenuService', '$state', 'platformWebApp.widgetService',
        function (mainMenuService, $state, widgetService) {
            //Register module in main menu
        //    var menuItem = {
        //        path: 'browse/MarketplaceCommunicationModule',
        //        icon: 'fa fa-cube',
        //        title: 'MarketplaceCommunicationModule',
        //        priority: 100,
        //        action: function () { $state.go('workspace.MarketplaceCommunicationModuleState'); },
        //        permission: 'MarketplaceCommunicationModule:access',
        //    };
        //    mainMenuService.addMenuItem(menuItem);

            // Seller product details: communication widget
            var productCommunicationWidget = {
                controller: 'virtoCommerce.marketplaceCommunicationModule.productCommunicationWidgetController',
                template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/widgets/product-communication-widget.tpl.html'
            };
            widgetService.registerWidget(productCommunicationWidget, 'sellerProductDetailsWidgetContainer');

        }
    ]);
