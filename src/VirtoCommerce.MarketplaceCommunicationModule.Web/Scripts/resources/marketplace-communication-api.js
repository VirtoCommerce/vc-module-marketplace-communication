angular.module('virtoCommerce.marketplaceCommunicationModule')
    .factory('virtoCommerce.marketplaceCommunicationModule.webApi', ['$resource', function ($resource) {
        return $resource('api/vcmp', null, {
            // messages
            searchMessages: { method: 'POST', url: 'api/vcmp/message/search' },
            sendMessage: { method: 'POST', url: 'api/vcmp/message/new' },
            updateMessage: { method: 'POST', url: 'api/vcmp/message/update' },
            deleteMessage: {
                method: 'DELETE',
                url: 'api/vcmp/message',
                transformRequest: function(data) {
                    return angular.toJson({
                        messageIds: Array.isArray(data.messageIds) ? data.messageIds : [data.messageIds]
                    });
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                hasBody: true,
                params: {}
            },
            markRead: { method: 'POST', url: 'api/vcmp/message/markread' },
            sendReaction: { method: 'POST', url: 'api/vcmp/message/sendreaction' },
            getMessage: { method: 'GET', url: 'api/vcmp/message/getbyid' },
            getThread: { method: 'GET', url: 'api/vcmp/message/thread', isArray: true },
            // communication users
            getUserInfos: { method: 'GET', url: 'api/vcmp/communicationuser/info', isArray: true },
            getOperator: { method: 'GET', url: 'api/vcmp/communicationuser/operator' },
            getOrCreateUser: { method: 'GET', url: 'api/vcmp/communicationuser/getorcreate' },
            getSellerUser: { method: 'POST', url: 'api/vcmp/communicationuser/seller' },
            // conversation
            searchConversations: { method: 'POST', url: 'api/vcmp/conversation/search' },
            getConversationById: { method: 'GET', url: 'api/vcmp/conversation/getbyid' },
            updateConversation: { method: 'POST', url: 'api/vcmp/conversation/update' },
            getOrCreateConversation: { method: 'POST', url: 'api/vcmp/conversation/new' },
            // settings
            getCommunicationSettings: { method: 'GET', url: '/api/vcmp/communication/settings' }
        });
    }]);
