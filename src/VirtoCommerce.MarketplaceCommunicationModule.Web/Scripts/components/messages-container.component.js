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
        onDelete: '&',
        onStartEdit: '&',
        markAsRead: '&',
        searchMessagesLoading: '=',
        shouldShowUnreadDot: '&',
        updateMessage: '&',
        onReply: '&',
        onScrollToQuote: '&',
        getQuotedMessage: '&',
        settings: '<'
    },
    controller: ['$scope', function($scope) {
        var $ctrl = this;

        $ctrl.handleUpdateMessage = function(params) {
            return $ctrl.updateMessage({params: params.params || params});
        };

        $ctrl.$onInit = function() {
        };

        $ctrl.handleDelete = function(message) {
            return $ctrl.onDelete({message: message});
        };

        $ctrl.handleStartEdit = function(message) {
            return $ctrl.onStartEdit({message: message});
        };

        $ctrl.handleMarkAsRead = function(message) {
            return $ctrl.markAsRead({message: message});
        };

        $ctrl.handleShouldShowUnreadDot = function(message) {
            if (!message) {
                return false;
            }
            return $ctrl.shouldShowUnreadDot({message: message});
        };
    }]
});
