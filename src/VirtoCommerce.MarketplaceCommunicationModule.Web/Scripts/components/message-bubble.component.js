angular.module('virtoCommerce.marketplaceCommunicationModule')
    .component('messageBubble', {
        templateUrl: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/components/message-bubble.tpl.html',
        bindings: {
            message: '<',
            currentUser: '<',
            isOwnMessage: '<',
            onReply: '&',
            onEdit: '&',
            onDelete: '&',
            onScrollToQuote: '&',
            getQuotedMessage: '&'
        },
        controller: ['$timeout', function ($timeout) {
            var $ctrl = this;

            $ctrl.quotedMessage = null;
            $ctrl.quoteLoading = false;
            $ctrl.isCollapsed = true;
            $ctrl.isTruncated = false;
            $ctrl.canManage = false;

            $ctrl.$onInit = function () {
                $ctrl.canManage = $ctrl.currentUser &&
                    $ctrl.message.senderId === $ctrl.currentUser.id &&
                    (!$ctrl.message.answersCount || $ctrl.message.answersCount === 0);

                // Resolve quote if message is a reply
                if ($ctrl.message.threadId) {
                    $ctrl.quoteLoading = true;
                    $ctrl.getQuotedMessage({ messageId: $ctrl.message.threadId }).then(function (msg) {
                        $ctrl.quotedMessage = msg;
                        $ctrl.quoteLoading = false;
                    });
                }
            };

            $ctrl.$postLink = function () {
                // Check content truncation after render
                $timeout(function () {
                    var contentEl = document.querySelector('[data-message-id="' + $ctrl.message.id + '"] .message-bubble__content');
                    if (contentEl) {
                        var lineHeight = parseFloat(window.getComputedStyle(contentEl).lineHeight) || 20;
                        $ctrl.isTruncated = contentEl.scrollHeight > lineHeight * 4;
                    }
                });
            };

            $ctrl.toggleContent = function () {
                $ctrl.isCollapsed = !$ctrl.isCollapsed;
            };

            $ctrl.handleQuoteClick = function () {
                if ($ctrl.quotedMessage) {
                    $ctrl.onScrollToQuote({ messageId: $ctrl.message.threadId });
                }
            };
        }]
    });
