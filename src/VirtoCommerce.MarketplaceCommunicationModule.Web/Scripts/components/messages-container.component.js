angular.module('virtoCommerce.marketplaceCommunicationModule').component('messagesContainer', {
    templateUrl: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/components/messages-container.tpl.html',
    bindings: {
        messages: '=',
        isLoadingPrevious: '=',
        isLoadingMore: '=',
        hasPrevious: '=',
        hasMore: '=',
        totalCount: '=',
        currentUser: '=',
        onLoadPrevious: '&',
        onLoadMore: '&',
        threadLoadingStates: '=',
        hasReplies: '&',
        deleteMessage: '&',
        editMessage: '&',
        markAsRead: '&',
        toggleReplies: '&',
        getMessageReplies: '&',
        hasMoreReplies: '&',
        loadMoreReplies: '&',
        hasPreviousReplies: '&',
        loadPreviousReplies: '&',
        searchMessagesLoading: '=',
        shouldShowUnreadDot: '&',
        sendReply: '&',
        updateMessage: '&'
    },
    controller: ['$scope', function($scope) {
        var $ctrl = this;

        $ctrl.onSendReply = function({message, text}) {
            return $ctrl.sendReply({
                message: message,
                text: text
            });
        };

        $ctrl.handleUpdateMessage = function(params) {
            return $ctrl.updateMessage({params: params.params || params});
        };

        $ctrl.$onInit = function() {
            $ctrl.threadLoadingStates = $ctrl.threadLoadingStates || {
                previous: {},
                more: {}
            };
        };

        $ctrl.deleteMessage = function(message) {
            return $ctrl.deleteMessage({message: message});
        };

        $ctrl.editMessage = function(message) {
            return $ctrl.editMessage({message: message});
        };

        $ctrl.markAsRead = function(message) {
            return $ctrl.markAsRead({message: message});
        };

        $ctrl.toggleReplies = function(message) {
            return $ctrl.toggleReplies({message: message});
        };

        $ctrl.getMessageReplies = function(message) {
            return $ctrl.getMessageReplies({message: message});
        };

        $ctrl.hasReplies = function(message) {
            return $ctrl.hasReplies({message: message});
        };

        $ctrl.hasMoreReplies = function(message) {
            return $ctrl.hasMoreReplies({message: message});
        };

        $ctrl.loadMoreReplies = function(message) {
            return $ctrl.loadMoreReplies({message: message});
        };

        $ctrl.loadPreviousReplies = function(message) {
            if (!message) {
                console.error('No message provided to loadPreviousReplies');
                return;
            }
            return $ctrl.loadPreviousReplies({message: message});
        };

        $ctrl.shouldShowUnreadDot = function(message) {
            if (!message) {
                return false;
            }
            return $ctrl.shouldShowUnreadDot({message: message});
        };
    }]
});
