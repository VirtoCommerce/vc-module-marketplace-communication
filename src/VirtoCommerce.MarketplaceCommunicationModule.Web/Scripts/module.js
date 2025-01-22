// Call this to register your module to main application
var moduleName = 'virtoCommerce.marketplaceCommunicationModule';

if (AppDependencies !== undefined) {
    AppDependencies.push(moduleName);
}

angular.module(moduleName, [])
    .directive('onVisible', require('./directives/onVisible'))
    .directive('vcFocus', require('./directives/vcFocus'))

    .component('message-tree', require('./components/message-tree.component'))
    .component('conversation-header', require('./components/conversation-header.component'))
    .component('empty-state', require('./components/empty-state.component'))
    .component('messages-container', require('./components/messages-container.component'))
    .component('message-composer', require('./components/message-composer.component'))
    .component('message-skeleton', require('./components/message-skeleton.component'))
    .component('show-more-messages', require('./components/show-more-messages.component'))
    .component('message-assets', require('./components/message-assets.component'))

    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('workspace.communication', {
                    url: '/communication',
                    params: {
                        notification: null,
                    },
                    templateUrl: '$(Platform)/Scripts/common/templates/home.tpl.html',
                    controller: [
                        '$stateParams', 'platformWebApp.bladeNavigationService',
                        function ($stateParams, bladeNavigationService) {
                            var newBlade = {
                                id: 'conversationList',
                                controller: 'virtoCommerce.marketplaceCommunicationModule.conversationListController',
                                template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/conversation-list.tpl.html',
                                isClosingDisabled: true,
                                notification: $stateParams.notification,
                            };
                            bladeNavigationService.showBlade(newBlade);
                        }
                    ]
                });
        }
    ])
    .run(['$state',
        'platformWebApp.mainMenuService', 'platformWebApp.widgetService', 'platformWebApp.bladeNavigationService',
        'platformWebApp.metaFormsService', 'virtoCommerce.orderModule.knownOperations',
        'virtoCommerce.marketplaceCommunicationModule.entityTypesResolverService', 'platformWebApp.pushNotificationTemplateResolver',
        'virtoCommerce.marketplaceModule.webApi', 'virtoCommerce.orderModule.order_res_customerOrders',
        function ($state,
            mainMenuService, widgetService, bladeNavigationService,
            metaFormsService, orderKnownOperations,
            entityTypesResolverService, pushNotificationTemplateResolver,
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

            // Seller details: communication widget
            var sellerCommunicationWidget = {
                controller: 'virtoCommerce.marketplaceCommunicationModule.sellerCommunicationWidgetController',
                template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/widgets/seller-communication-widget.tpl.html'
            };
            widgetService.registerWidget(sellerCommunicationWidget, 'sellerDetails');

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

            // Seller entityType resolver
            var sellerMetaFields = metaFormsService.getMetaFields('SellerDetails');
            entityTypesResolverService.registerType({
                entityType: 'VirtoCommerce.MarketplaceVendorModule.Core.Domains.Seller',
                entityIdFieldName: 'sellerId',
                entityImageFieldName: 'logo',
                sellerIdFieldName: 'id',
                detailBlade: {
                    id: 'sellerDetails',
                    headIcon: 'fas fa-store',
                    controller: 'virtoCommerce.marketplaceModule.sellerDetailsController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceVendor)/Scripts/blades/seller-details.tpl.html',
                    metaFields: sellerMetaFields
                },
                searchEntities: function (searchCriteria, setEntitiesCallback) {
                    marketplaceApi.searchSellers(searchCriteria, (data) => {
                        setEntitiesCallback(data);
                    });
                },
                knownChildrenTypes: []
            });

            // SellerProduct entityType resolver
            var sellerProductMetaFields = metaFormsService.getMetaFields('SellerProductDetails');
            entityTypesResolverService.registerType({
                entityType: 'VirtoCommerce.MarketplaceVendorModule.Core.Domains.SellerProduct',
                entityIdFieldName: 'sellerProductId',
                entityImageFieldName: 'imgSrc',
                entityInfoFieldName: 'sellerName',
                sellerIdFieldName: 'sellerId',
                detailBlade: {
                    id: 'sellerProductDetails',
                    headIcon: 'fas fa-folder',
                    controller: 'virtoCommerce.marketplaceModule.sellerProductDetailsController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceVendor)/Scripts/blades/seller-product-details.tpl.html',
                    metaFields: sellerProductMetaFields
                },
                searchEntities: function (searchCriteria, setEntitiesCallback) {
                    marketplaceApi.listitemssearch(searchCriteria, (data) => {
                        setEntitiesCallback(data);
                    });
                },
                knownChildrenTypes: []
            });

            // Offer entityType resolver
            var offerMetaFieldsReadonly = metaFormsService.getMetaFields('OfferDetailsReadonly');
            var offerMetaFieldsEditable = metaFormsService.getMetaFields('OfferDetailsEditable');
            entityTypesResolverService.registerType({
                entityType: 'VirtoCommerce.MarketplaceVendorModule.Core.Domains.Offer',
                entityIdFieldName: 'offerId',
                entityImageFieldName: 'imgSrc',
                entityInfoFieldName: 'sellerName',
                sellerIdFieldName: 'sellerId',
                detailBlade: {
                    id: 'offerDetails',
                    headIcon: 'fa fa-usd',
                    controller: 'virtoCommerce.marketplaceModule.offerDetailsController',
                    template: 'Modules/$(VirtoCommerce.MarketplaceVendor)/Scripts/blades/offer-details.tpl.html',
                    metaFieldsReadonly: offerMetaFieldsReadonly,
                    metaFieldsEditable: offerMetaFieldsEditable
                },
                searchEntities: function (searchCriteria, setEntitiesCallback) {
                    marketplaceApi.searchOffers(searchCriteria, (data) => {
                        setEntitiesCallback(data);
                    });
                },
                knownChildrenTypes: []
            });

            // Order entityType resolver
            var orderTemplate = orderKnownOperations.getOperation('CustomerOrder');
            var orderDetailBlade = orderTemplate ? orderTemplate.detailBlade : {};
            orderDetailBlade = angular.extend(orderDetailBlade, { headIcon: "fa fa-file-text" });
            entityTypesResolverService.registerType({
                entityType: 'VirtoCommerce.OrdersModule.Core.Model.CustomerOrder',
                entityIdFieldName: 'currentEntityId',
                entityFieldName: 'customerOrder',
                entityNameFieldName: 'number',
                entityInfoFieldName: 'employeeName',
                sellerIdFieldName: 'employeeId',
                detailBlade: orderDetailBlade,
                getEntity: function (entityId, setEntityCallback) {
                    ordersApi.get({ id: entityId }, (data) => {
                        setEntityCallback(data);
                    });
                },
                searchEntities: function (searchCriteria, setEntitiesCallback) {
                    searchCriteria.hasParentOperation = true;
                    ordersApi.search(searchCriteria, (data) => {
                        data.results.forEach(x => x.iconUrl = x.items[0].imageUrl)
                        setEntitiesCallback(data);
                    });
                },
                knownChildrenTypes: []
            });

            // Conversation details metafields
            metaFormsService.registerMetaFields('Conversation',
                [
                    {
                        name: 'name',
                        title: 'marketplaceCommunication.blades.conversation-details.labels.name',
                        valueType: 'ShortText'
                    },
                    {
                        name: 'iconUrl',
                        title: 'marketplaceCommunication.blades.conversation-details.labels.icon',
                        templateUrl: 'conversationDetails-iconImage.html'
                    },
                ]
            );

            // Message notification template
            pushNotificationTemplateResolver.register({
                priority: 900,
                satisfy: function (notify, place) {
                    return (place === 'history' || place === 'header-notification')
                        && notify.notifyType === 'MessagePushNotification';
                },
                template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/notifications/message-notification.tpl.html',
            //    action: function (notify) {
            //        var blade = {
            //            id: 'conversationList',
            //            notification: notify,
            //            controller: 'virtoCommerce.marketplaceCommunicationModule.conversationListController',
            //            template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/conversation-list.tpl.html'
            //        };
            //        bladeNavigationService.showBlade(blade);
                //    }
                action: function (notify) {
                    if ($state.current.name !== 'workspace.communication') {
                        $state.go('workspace.communication', { notification: notify });
                    }
                    else {
                        var blade = {
                            id: 'conversationList',
                            notification: notify,
                            isClosingDisabled: true,
                            controller: 'virtoCommerce.marketplaceCommunicationModule.conversationListController',
                            template: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/blades/conversation-list.tpl.html'
                        };
                        bladeNavigationService.showBlade(blade);
                    }
                }

            });


        }
    ]);
