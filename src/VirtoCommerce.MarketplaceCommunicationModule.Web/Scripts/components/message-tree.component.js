angular.module('virtoCommerce.marketplaceCommunicationModule')
.component('messageTree', {
    bindings: {
        message: '<',
        currentUser: '<',
        parentController: '<',
        onDelete: '&',
        onEdit: '&',
        onMarkRead: '&',
        onToggleReplies: '&',
        getMessageReplies: '&',
        hasReplies: '&',
        searchMessagesLoading: '<',
        hasMoreReplies: '&',
        loadMoreReplies: '&',
        hasPreviousReplies: '<',
        loadPreviousReplies: '&',
        loadingStates: '<',
        onShouldShowUnreadDot: '&',
        maxLines: '<?',
        onSendReply: '&',
        updateMessage: '&',
        settings: '<'
    },
    templateUrl: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/components/message-tree.tpl.html',
    controller: ['$scope', '$element', '$timeout', 'messageFormsService',
    function($scope, $element, $timeout, messageFormsService) {
        var $ctrl = this;

        $ctrl.replyForm = {
            text: '',
            isVisible: false,
            attachments: []
        };

        $ctrl.editMode = {
            isActive: false,
            text: '',
            attachments: []
        };

        $ctrl.startEdit = function() {
            $ctrl.editMode.text = $ctrl.message.content;
            $ctrl.editMode.attachments = angular.copy($ctrl.message.attachments || []);
            $ctrl.editMode.isActive = true;

            console.log($ctrl.message);

            messageFormsService.openForm('edit-' + $ctrl.message.id);
        };

        $ctrl.cancelEdit = function() {
            $ctrl.editMode.isActive = false;
            $ctrl.editMode.text = '';
            $ctrl.editMode.attachments = [];
        };

        $ctrl.showReplyForm = function() {
            $ctrl.replyForm.isVisible = true;
            messageFormsService.openForm('reply-' + $ctrl.message.id);
        };

        $ctrl.hideReplyForm = function() {
            if (messageFormsService.isFormActive('reply-' + $ctrl.message.id)) {
                messageFormsService.closeAllForms();
            }
            $ctrl.replyForm.isVisible = false;
            $ctrl.replyForm.text = '';
            $ctrl.replyForm.attachments = [];
        };

        $ctrl.checkHasReplies = function(message) {
            if (message && message.answersCount !== undefined) {
                return message.answersCount > 0;
            }
            return $ctrl.hasReplies({message: message});
        };

        $ctrl.submitReply = function() {
            if (!$ctrl.replyForm.text || !$ctrl.replyForm.text.trim()) return;

            $ctrl.isLoading = true;

            $ctrl.onSendReply({
                message: $ctrl.message,
                text: $ctrl.replyForm.text,
                attachments: $ctrl.replyForm.attachments
            });
            $ctrl.hideReplyForm();
        };

        $ctrl.updateMessage = function(params) {
            return $ctrl.updateMessage(params);
        };

        $ctrl.submitEdit = function() {
            if (!$ctrl.editMode.text || !$ctrl.editMode.text.trim()) return;

            var updateParams = {
                message: $ctrl.message,
                newContent: $ctrl.editMode.text,
                attachments: $ctrl.editMode.attachments
            };

            $ctrl.updateMessage({
                params: updateParams
            });

            $ctrl.editMode.isActive = false;
            $ctrl.editMode.text = '';
        };

        $ctrl.delayedMarkRead = function(message) {

            $timeout(function() {
                $ctrl.onMarkRead({message: message});
            }, 2000);
        };

        $ctrl.toggleContent = function() {
            $ctrl.isExpanded = !$ctrl.isExpanded;
        };

        $ctrl.$onInit = function() {
            $ctrl.maxLines = $ctrl.maxLines || 4;
            $ctrl.isExpanded = false;
            $ctrl.needsExpansion = false;

            $timeout(function() {
                var contentElement = $element[0].querySelector('.message-content');
                if (contentElement) {
                    var contentHeight = contentElement.scrollHeight;
                    var lineHeight = 20;
                    var maxHeight = $ctrl.maxLines * lineHeight;
                    $ctrl.needsExpansion = contentHeight > maxHeight;
                }
            });

            $ctrl.loadingStates = $ctrl.loadingStates || {
                previous: {},
                more: {}
            };
        };

        $ctrl.isLoadingPrevious = function(messageId) {
            return $ctrl.loadingStates &&
                   $ctrl.loadingStates.previous &&
                   $ctrl.loadingStates.previous[messageId];
        };

        $ctrl.isLoadingMore = function(messageId) {
            return $ctrl.loadingStates &&
                   $ctrl.loadingStates.more &&
                   $ctrl.loadingStates.more[messageId];
        };

        $scope.$watch(function() {
            return messageFormsService.activeForm;
        }, function(activeForm) {
            if (activeForm) {
                if ($ctrl.editMode.isActive && activeForm !== 'edit-' + $ctrl.message.id) {
                    $ctrl.editMode.isActive = false;
                    $ctrl.editMode.text = '';
                    $ctrl.editMode.attachments = [];
                }

                if ($ctrl.replyForm.isVisible && activeForm !== 'reply-' + $ctrl.message.id) {
                    $ctrl.replyForm.isVisible = false;
                    $ctrl.replyForm.text = '';
                    $ctrl.replyForm.attachments = [];
                }
            }
        });

        $ctrl.shouldShowPreviousLoader = function() {
            return !$ctrl.isLoadingPrevious($ctrl.message.id) &&
                   $ctrl.hasPreviousReplies;
        };

        $ctrl.onPreviousLoaderVisible = function() {
            if ($ctrl.message && !$ctrl.isLoadingPrevious($ctrl.message.id)) {
                $ctrl.loadPreviousReplies({
                    message: $ctrl.message
                });
            }
        };

        $ctrl.shouldShowUnreadDot = function(message) {
            if (!message) {
                return false;
            }
            return $ctrl.onShouldShowUnreadDot({message: message});
        };

        $ctrl.handleKeyPress = function(event, action) {
            if (event.keyCode === 13 && !event.shiftKey) {
                event.preventDefault();
                if (action === 'reply') {
                    $ctrl.submitReply();
                } else if (action === 'edit') {
                    $ctrl.submitEdit();
                }
            }
        };
    }]
});
