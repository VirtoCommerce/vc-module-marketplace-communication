angular.module('virtoCommerce.marketplaceCommunicationModule')
    .factory('virtoCommerce.marketplaceCommunicationModule.webApi', ['$resource', function ($resource) {
        return $resource('api/vcmp', null, {
            // messages
            searchMessages: { method: 'POST', url: 'api/vcmp/message/search' },
            sendMessage: { method: 'POST', url: 'api/vcmp/message/new' },
            updateMessage: { method: 'POST', url: 'api/vcmp/message/update' },
            deleteMessage: { method: 'DELETE', url: 'api/vcmp/message', isArray: true },
            markRead: { method: 'POST', url: 'api/vcmp/message/markread' },
            sendReaction: { method: 'POST', url: 'api/vcmp/message/sendreaction' },
            // communication users
            getUserInfos: { method: 'GET', url: 'api/vcmp/communicationuser/info', isArray: true },
            getOperator: { method: 'GET', url: 'api/vcmp/communicationuser/operator' },
            getSellerUser: { method: 'POST', url: 'api/vcmp/communicationuser/seller' },
        });
    }]);
