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
                                id: 'conversationList',
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
        'platformWebApp.metaFormsService', 'virtoCommerce.orderModule.knownOperations', 'virtoCommerce.marketplaceCommunicationModule.entityTypesResolverService',
        'virtoCommerce.marketplaceModule.webApi', 'virtoCommerce.orderModule.order_res_customerOrders',
        function (mainMenuService, $state, widgetService,
            metaFormsService, orderKnownOperations, entityTypesResolverService,
            marketplaceApi, ordersApi) {

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

            // SellerProduct entityType resolver
            var sellerProductMetaFields = metaFormsService.getMetaFields('SellerProductDetails');
            entityTypesResolverService.registerType({
                entityType: 'VirtoCommerce.MarketplaceVendorModule.Core.Domains.SellerProduct',
                entityIdFieldName: 'sellerProductId',
                detailBlade: {
                    id: 'sellerProductDetails',
                    headIcon: 'fas fa-folder',
                    controller: 'virtoCommerce.marketplaceModule.sellerProductDetailsController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceVendor)/Scripts/blades/seller-product-details.tpl.html',
                    metaFields: sellerProductMetaFields
                },
                knownChildrenTypes: []
            });

            // Offer entityType resolver
            var offerMetaFieldsReadonly = metaFormsService.getMetaFields('OfferDetailsReadonly');
            var offerMetaFieldsEditable = metaFormsService.getMetaFields('OfferDetailsEditable');
            entityTypesResolverService.registerType({
                entityType: 'VirtoCommerce.MarketplaceVendorModule.Core.Domains.Offer',
                entityIdFieldName: 'offerId',
                detailBlade: {
                    id: 'offerDetails',
                    headIcon: 'fas fa-store',
                    controller: 'virtoCommerce.marketplaceModule.offerDetailsController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceVendor)/Scripts/blades/offer-details.tpl.html',
                    metaFieldsReadonly: offerMetaFieldsReadonly,
                    metaFieldsEditable: offerMetaFieldsEditable
                },
                knownChildrenTypes: []
            });

            // Order entityType resolver
            var orderTemplate = orderKnownOperations.getOperation('CustomerOrder');
            entityTypesResolverService.registerType({
                entityType: 'VirtoCommerce.OrdersModule.Core.Model.CustomerOrder',
                entityIdFieldName: 'currentEntityId',
                entityFieldName: 'customerOrder',
                detailBlade: orderTemplate ? orderTemplate.detailBlade : {},
                getEntity: function (entityId, setEntityCallback) {
                    ordersApi.get({ id: entityId }, (data) => {
                        setEntityCallback(data);
                    });
                },
                knownChildrenTypes: []
            });

        }
    ]);
