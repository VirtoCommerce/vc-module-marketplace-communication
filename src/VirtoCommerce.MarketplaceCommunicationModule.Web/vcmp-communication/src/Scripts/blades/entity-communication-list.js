angular.module('virtoCommerce.marketplaceCommunicationModule')
.directive('onVisible', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        scope: {
            onVisible: '&',
            isScrolling: '='
        },
        link: function(scope, element, attrs) {
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting && !scope.isScrolling) {
                        $timeout(function() {
                            scope.onVisible();
                        });
                        observer.disconnect();
                    }
                });
            }, { threshold: [0.1], rootMargin: '100px' });

            observer.observe(element[0]);

            scope.$on('$destroy', function() {
                observer.disconnect();
            });
        }
    };
}])
.directive('vcFocus', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.$watch(attrs.vcFocus, function (value) {
                if (value === true) {
                    $timeout(function () {
                        element[0].focus();
                    });
                }
            });
        }
    };
}])
.directive('messageTree', ['$compile', '$timeout', 'messageFormsService', function($compile, $timeout, messageFormsService) {
    return {
        restrict: 'E',
        scope: {
            message: '=',
            currentUser: '=',
            parentController: '=',
            onDelete: '&',
            onEdit: '&',
            onMarkRead: '&',
            onToggleReplies: '&',
            getMessageReplies: '&',
            hasReplies: '&',
            searchMessagesLoading: '=',
            hasMoreReplies: '&',
            loadMoreReplies: '&',
            hasPreviousReplies: '=',
            loadPreviousReplies: '&',
            loadingStates: '=',
            shouldShowUnreadDot: '&',
            maxLines: '=?'
        },
        template: `
            <div class="message-item"
                 style="padding: 10px; margin-bottom: 5px; border: 1px solid #dee9f0; border-radius: 4px;"
                 data-message-id="{{message.id}}"
                 is-scrolling="parentController.blade.isScrollingToMessage"
                 ng-style="{'background-color': message.id === selectedMessageId ? '#ecf7fc' : 'transparent'}">
                <div>
                    <!-- Header with avatar and user info -->
                    <div style="margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center;">
                            <div ng-if="message.senderInfo.avatarUrl"
                                style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px;">
                                <img ng-src="{{message.senderInfo.avatarUrl}}"
                                    style="width: 100%; height: 100%; border-radius: 50%;"
                                    alt="{{ 'marketplaceCommunication.blades.entity-communication.labels.user-avatar' | translate }}">
                            </div>
                            <div ng-if="!message.senderInfo.avatarUrl"
                                style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; background: #e0e0e0; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-user" style="color: #666;"></i>
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: bold;">
                                    {{message.senderInfo.userName || message.senderId}}
                                </span>
                                <span style="color: #999; font-size: 12px;" am-time-ago="message.createdDate"></span>
                            </div>
                        </div>
                        <div ng-if="shouldShowUnreadDot(message)"
                             on-visible="delayedMarkRead(message)"
                             style="width: 8px; height: 8px; border-radius: 50%; background-color: #e53935;">
                        </div>
                    </div>

                    <!-- Message content -->
                    <div ng-if="!editMode.isActive" style="margin: 10px 0;">
                        <div class="message-content"
                             ng-class="{'expanded': isExpanded}"
                             ng-style="!isExpanded && {'max-height': maxLines * 20 + 'px'}"
                             style="position: relative; line-height: 20px; overflow: hidden; transition: max-height 0.3s ease-out;">
                            <div>{{message.content}}</div>
                            <!-- Gradient overlay -->
                            <div ng-if="!isExpanded && needsExpansion"
                                 style="position: absolute; bottom: 0; left: 0; right: 0; height: 20px; background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%); pointer-events: none;"></div>
                        </div>
                        <div ng-if="needsExpansion"
                             ng-click="toggleContent()"
                             style="color: #1c84c6; cursor: pointer; padding-top: 5px; user-select: none;">
                            <span ng-if="!isExpanded">
                                <i class="fa fa-chevron-down" style="margin-right: 5px;"></i>
                                {{ 'marketplaceCommunication.blades.entity-communication.labels.show-more' | translate }}
                            </span>
                            <span ng-if="isExpanded">
                                <i class="fa fa-chevron-up" style="margin-right: 5px;"></i>
                                {{ 'marketplaceCommunication.blades.entity-communication.labels.show-less' | translate }}
                            </span>
                        </div>
                    </div>

                    <!-- Edit form -->
                    <div ng-if="editMode.isActive" style="margin: 10px 0;">
                        <textarea
                            ng-model="editMode.text"
                            style="width: -webkit-fill-available; min-height: 80px; margin-bottom: 10px; padding: 8px; font: inherit;"
                            placeholder="{{ 'marketplaceCommunication.blades.entity-communication.labels.edit-message' | translate }}"
                            vc-focus="editMode.isActive"></textarea>
                        <div>
                            <button class="btn __cancel" ng-click="cancelEdit()">
                                <span class="fa fa-times" style="margin-right: 5px;"></span>
                                {{ 'marketplaceCommunication.blades.entity-communication.buttons.cancel' | translate }}
                            </button>
                            <button class="btn" ng-click="submitEdit()" ng-disabled="!editMode.text">
                                <span class="fa fa-paper-plane" style="margin-right: 5px;"></span>
                                {{ 'marketplaceCommunication.blades.entity-communication.buttons.save' | translate }}
                            </button>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <div class="form-group">
                            <button class="btn" ng-click="showReplyForm()"
                                    ng-if="!editMode.isActive && !replyForm.isVisible">
                                <span class="fa fa-reply" style="margin-right: 5px;"></span>
                                {{ 'marketplaceCommunication.blades.entity-communication.buttons.reply' | translate }}
                            </button>
                            <button class="btn" ng-click="startEdit()"
                                    ng-if="message.senderId === currentUser.id && message.answersCount === 0 && !editMode.isActive && !replyForm.isVisible">
                                <span class="fa fa-pencil" style="margin-right: 5px;"></span>
                                {{ 'marketplaceCommunication.blades.entity-communication.buttons.edit' | translate }}
                            </button>
                            <button class="btn __cancel" ng-click="onDelete({message: message})"
                                    ng-if="message.senderId === currentUser.id && message.answersCount === 0 && !editMode.isActive && !replyForm.isVisible">
                                <span class="fa fa-trash-o" style="margin-right: 5px;"></span>
                                {{ 'marketplaceCommunication.blades.entity-communication.buttons.delete' | translate }}
                            </button>
                        </div>
                        <div class="form-group">
                            <button class="btn"
                                    style="font-size: 12px;"
                                    ng-if="hasReplies({message: message}) && !editMode.isActive && !replyForm.isVisible"
                                    ng-click="onToggleReplies({message: message})">
                            <span ng-if="message.isExpanded" class="fa fa-chevron-up" style="margin-right: 5px;"></span>
                            <span ng-if="!message.isExpanded" class="fa fa-chevron-down" style="margin-right: 5px;"></span>
                            <span ng-if="message.isExpanded" translate="marketplaceCommunication.blades.entity-communication.labels.hide-replies"></span>
                            <span ng-if="!message.isExpanded"
                                  translate="marketplaceCommunication.blades.entity-communication.labels.show-replies"
                                  translate-values="{ count: message.answersCount }"></span>
                            </button>
                        </div>
                    </div>

                    <!-- Reply form -->
                    <div ng-if="replyForm.isVisible" style="margin-top: 10px; padding: 10px; border: 1px solid #dee9f0; border-radius: 4px;">
                        <textarea
                            ng-model="replyForm.text"
                            style="width: -webkit-fill-available; min-height: 80px; margin-bottom: 10px; padding: 8px; font: inherit;"
                            placeholder="{{ 'marketplaceCommunication.blades.entity-communication.labels.write-reply' | translate }}"
                            vc-focus="replyForm.isVisible"></textarea>
                        <div>
                            <button class="btn __cancel" ng-click="hideReplyForm()">
                                <span class="fa fa-times" style="margin-right: 5px;"></span>
                                {{ 'marketplaceCommunication.blades.entity-communication.buttons.cancel' | translate }}
                            </button>
                            <button class="btn" ng-click="submitReply()" ng-disabled="!replyForm.text">
                                <span class="fa fa-paper-plane" style="margin-right: 5px;"></span>
                                {{ 'marketplaceCommunication.blades.entity-communication.buttons.send' | translate }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Replies container -->
            <div ng-if="hasReplies({message: message}) && message.isExpanded" style="position: relative; margin-left: 24px;">
                <!-- Previous replies skeleton -->
                <div ng-if="loadingStates.previous[message.id]"
                     style="padding-bottom: 10px;">
                    <div class="loading-skeleton" style="height: 60px; margin-bottom: 10px; background: #f0f0f0; border-radius: 4px; animation: pulse 1.5s infinite;">
                        <div style="display: flex; gap: 10px; padding: 10px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: #e0e0e0;"></div>
                            <div style="flex-grow: 1;">
                                <div style="width: 60%; height: 12px; background: #e0e0e0; margin-bottom: 8px;"></div>
                                <div style="width: 40%; height: 12px; background: #e0e0e0;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="loading-skeleton" style="height: 60px; background: #f0f0f0; border-radius: 4px; animation: pulse 1.5s infinite;">
                        <div style="display: flex; gap: 10px; padding: 10px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: #e0e0e0;"></div>
                            <div style="flex-grow: 1;">
                                <div style="width: 70%; height: 12px; background: #e0e0e0; margin-bottom: 8px;"></div>
                                <div style="width: 50%; height: 12px; background: #e0e0e0;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Previous replies loader -->
                <div ng-if="!loadingStates.previous[message.id] && hasPreviousReplies"
                     on-visible="loadPreviousReplies({message: message})"
                     is-scrolling="parentController.blade.isScrollingToMessage"
                     style="text-align: center; padding: 10px;">
                </div>

                <!-- Replies list -->
                <div ng-repeat="reply in getMessageReplies({message: message})" style="position: relative;">
                    <!-- Branch lines -->
                    <div style="position: absolute; left: -24px; top: 0; bottom: 0;">
                        <!-- Vertical line for non-last items -->
                        <div ng-if="!$last"
                             style="position: absolute; left: 0; top: 18px; bottom: 0; width: 1px; background-color: #dee9f0;"></div>
                        <!-- Branch corner -->
                        <div style="position: absolute; left: 0; top: -5px; width: 1px; height: 33px; background-color: #dee9f0;"></div>
                        <div style="position: absolute; left: 0; top: 28px; width: 24px; height: 1px; background-color: #dee9f0;"></div>
                    </div>

                    <!-- Recursive message-tree -->
                    <message-tree
                        message="reply"
                        current-user="currentUser"
                        parent-controller="parentController"
                        on-delete="onDelete({message: message})"
                        on-edit="onEdit({message: message})"
                        on-mark-read="onMarkRead({message: message})"
                        on-toggle-replies="onToggleReplies({message: message})"
                        get-message-replies="getMessageReplies({message: message})"
                        has-replies="hasReplies({message: message})"
                        has-more-replies="hasMoreReplies({message: message})"
                        load-more-replies="loadMoreReplies({message: message})"
                        has-previous-replies="hasPreviousReplies"
                        load-previous-replies="loadPreviousReplies({message: message})"
                        search-messages-loading="searchMessagesLoading">
                    </message-tree>
                </div>

                <!-- Next replies skeleton -->
                <div ng-if="loadingStates.more[message.id] && hasMoreReplies({message: message})"
                     style="padding-top: 10px;">
                    <div class="loading-skeleton" style="height: 60px; margin-bottom: 10px; background: #f0f0f0; border-radius: 4px; animation: pulse 1.5s infinite;">
                        <div style="display: flex; gap: 10px; padding: 10px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: #e0e0e0;"></div>
                            <div style="flex-grow: 1;">
                                <div style="width: 65%; height: 12px; background: #e0e0e0; margin-bottom: 8px;"></div>
                                <div style="width: 45%; height: 12px; background: #e0e0e0;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="loading-skeleton" style="height: 60px; background: #f0f0f0; border-radius: 4px; animation: pulse 1.5s infinite;">
                        <div style="display: flex; gap: 10px; padding: 10px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: #e0e0e0;"></div>
                            <div style="flex-grow: 1;">
                                <div style="width: 55%; height: 12px; background: #e0e0e0; margin-bottom: 8px;"></div>
                                <div style="width: 35%; height: 12px; background: #e0e0e0;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Next replies loader -->
                <div ng-if="!loadingStates.more[message.id] && hasMoreReplies({message: message})"
                     on-visible="loadMoreReplies({message: message})"
                     is-scrolling="parentController.blade.isScrollingToMessage"
                     style="text-align: center; padding: 10px;">
                </div>
            </div>
        `,
        link: function(scope, element, attrs) {
            scope.replyForm = {
                text: '',
                isVisible: false
            };

            scope.editMode = {
                isActive: false,
                text: ''
            };

            scope.startEdit = function() {
                scope.editMode.text = scope.message.content;
                scope.editMode.isActive = true;
                messageFormsService.openForm('edit-' + scope.message.id);
            };

            scope.cancelEdit = function() {
                scope.editMode.isActive = false;
                scope.editMode.text = '';
            };

            scope.showReplyForm = function() {
                scope.replyForm.isVisible = true;
                messageFormsService.openForm('reply-' + scope.message.id);
            };

            scope.hideReplyForm = function() {
                if (messageFormsService.isFormActive('reply-' + scope.message.id)) {
                    messageFormsService.closeAllForms();
                }
                scope.replyForm.isVisible = false;
                scope.replyForm.text = '';
            };

            scope.submitReply = function() {
                if (!scope.replyForm.text || !scope.replyForm.text.trim()) return;

                // Call controller method directly
                scope.parentController.sendReply(scope.message, scope.replyForm.text);
                scope.hideReplyForm();
            };

            scope.submitEdit = function() {
                if (!scope.editMode.text || !scope.editMode.text.trim()) return;

                scope.parentController.updateMessage({
                    message: scope.message,
                    newContent: scope.editMode.text
                });

                scope.editMode.isActive = false;
                scope.editMode.text = '';
            };

            scope.$watch(function() {
                return messageFormsService.activeForm;
            }, function(newFormId, oldFormId) {
                // Only close forms if a different form is being opened
                if (newFormId && newFormId !== oldFormId) {
                    // Handle edit form
                    if (scope.editMode.isActive && newFormId !== 'edit-' + scope.message.id) {
                        scope.editMode.isActive = false;
                        scope.editMode.text = '';
                    }

                    // Handle reply form
                    if (scope.replyForm.isVisible && newFormId !== 'reply-' + scope.message.id) {
                        scope.replyForm.isVisible = false;
                        scope.replyForm.text = '';
                    }
                }
            });

            scope.delayedMarkRead = function(message) {
                $timeout(function() {
                    scope.onMarkRead({message: message});
                }, 2000);
            };

            // Set default max lines
            scope.maxLines = scope.maxLines || 4;
            scope.isExpanded = false;
            scope.needsExpansion = false;

            // Check content height after content is rendered
            $timeout(function() {
                var contentElement = element[0].querySelector('.message-content');
                if (contentElement) {
                    var contentHeight = contentElement.scrollHeight;
                    var lineHeight = 20; // matches the CSS line-height
                    var maxHeight = scope.maxLines * lineHeight;
                    scope.needsExpansion = contentHeight > maxHeight;
                }
            });

            scope.toggleContent = function() {
                scope.isExpanded = !scope.isExpanded;
            };

            $compile(element.contents())(scope);
        }
    };
}])
.factory('messageFormsService', function() {
    var service = {
        activeForm: null,  // 'root', 'edit-{messageId}', 'reply-{messageId}'

        closeAllForms: function() {
            this.activeForm = null;
        },

        openForm: function(formId) {
            this.activeForm = formId;
        },

        isFormActive: function(formId) {
            return this.activeForm === formId;
        }
    };
    return service;
})
    .controller('virtoCommerce.marketplaceCommunicationModule.entityCommunicationListController',
    ['$scope', '$timeout', 'virtoCommerce.marketplaceCommunicationModule.webApi', 'platformWebApp.dialogService', 'messageFormsService',
    function ($scope, $timeout, api, dialogService, messageFormsService) {
        var blade = $scope.blade;
        blade.headIcon = 'fas fa-comment';
        blade.title = 'Communication';

        blade.messages = [];
        blade.threadsMap = {};
        $scope.selectedMessageId = null;
        $scope.replyingTo = null;
        $scope.newReplyText = '';
        $scope.currentUser = null;
        $scope.isLoading = false;
        $scope.searchMessagesLoading = false;

        // Create object to store form data
        $scope.replyForm = {
            text: '',
            replyingTo: null
        };

        // Form for root message
        $scope.mainForm = {
            text: ''
        };

        // Add pagination state
        blade.pageSize = 10;
        blade.currentPage = 1;
        blade.hasMore = true;
        blade.threadPageSize = 10;
        blade.threadPagesMap = {};

        // Add totalCount tracking
        blade.totalCount = 0;
        blade.threadTotalCounts = {};

        // Add flags for reverse scrolling
        blade.hasPrevious = false;
        blade.threadHasPrevious = {};

        // Add flag for programmatic scrolling
        blade.isScrollingToMessage = false;

        // Add new loading states
        $scope.isLoadingPrevious = false;  // For top scroll of root messages
        $scope.isLoadingMore = false;      // For bottom scroll of root messages
        $scope.threadLoadingStates = {     // For child messages
            previous: {},
            more: {}
        };

        // Add this line to initialize the form state
        $scope.isFormExpanded = false;

        // Initialize the form object if it doesn't exist
        $scope.mainForm = $scope.mainForm || {};

        $scope.expandForm = function() {
            messageFormsService.openForm('root');
            $scope.isFormExpanded = true;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        $scope.cancelMessage = function() {
            messageFormsService.closeAllForms();
            $scope.mainForm.text = '';
            $scope.isFormExpanded = false;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        function initialize() {
            blade.threadHasMore = {};
            blade.threadHasPrevious = {};
            blade.threadPagesMap = {};

            // Ensure threadHasPrevious is initialized for all messages
            blade.messages?.forEach(message => {
                var threadId = message.threadId || message.id;
                blade.threadHasPrevious[threadId] = false;
            });

            api.getOperator({}, function(operator) {
                $scope.currentUser = operator;
            });

            if (blade.conversationId) {
                api.getConversationById({
                    conversationId: blade.conversationId
                }, function (conversation) {
                    $scope.messageRecipientId = conversation.users?.find(x => x.userId != $scope.currentUser.id)?.userId;
                });
            }
            else if (blade.entityId && blade.entityType) {
                api.getSellerUser({
                    entityId: blade.entityId,
                    entityType: blade.entityType
                }, function (seller) {
                    $scope.sellerUser = seller;
                    $scope.messageRecipientId = seller.id;
                });
            }
        }

        $scope.sendReply = function(parentMessage, replyText) {
            if (!replyText || !replyText.trim()) {
                return;
            }

            blade.isLoading = true;
            var sentTime = new Date();

            var command = {
                message: {
                    content: replyText.trim(),
                    entityId: blade.entityId,
                    entityType: blade.entityType,
                    conversationId: blade.conversationId,
                    replyTo: parentMessage.id,
                    senderId: $scope.currentUser.id,
                    recipientId: parentMessage.senderId
                }
            };

            api.sendMessage(command, function() {
                var searchCriteria = {
                    entityId: blade.entityId,
                    entityType: blade.entityType,
                    conversationId: blade.conversationId,
                    threadId: parentMessage.id,
                    responseGroup: 'Full',
                    take: 10,
                    sort: 'createdDate:desc'
                };

                api.searchMessages(searchCriteria, function(response) {
                    if (response && response.results) {
                        var threadId = parentMessage.id;
                        blade.threadsMap[threadId] = response.results.reverse();
                        blade.threadTotalCounts[threadId] = response.totalCount;
                        blade.threadHasMore[threadId] = false;

                        // Set flag for previous messages
                        blade.threadHasPrevious[threadId] = response.totalCount > response.results.length;

                        // Update answers count on parent message
                        parentMessage.answersCount = response.totalCount;

                        // Load user info for new messages
                        loadUserInfoForMessages(response.results);

                        // Expand replies if not already expanded
                        if (!parentMessage.isExpanded) {
                            parentMessage.isExpanded = true;
                        }

                        // Find and scroll to the new message
                        var newMessage = response.results.find(function(msg) {
                            var timeDiff = Math.abs(new Date(msg.createdDate).getTime() - sentTime.getTime());
                            return msg.content === replyText.trim() && timeDiff <= 10000;
                        });

                        if (newMessage) {
                            scrollToMessage(newMessage.id);
                        }
                    }
                }).$promise.finally(function() {
                    blade.isLoading = false;
                });
            });
        };

        $scope.toggleReplies = function(message) {
            message.isExpanded = !message.isExpanded;

            if (message.isExpanded) {

                var threadId = message.id;
                if (!blade.threadsMap[threadId] || blade.threadsMap[threadId].length === 0) {
                    loadThreadMessages(threadId);
                }
                // Set hasPrevious only if we know there are more messages than currently loaded
                blade.threadHasPrevious = blade.threadHasPrevious || {};
                var currentMessages = blade.threadsMap[threadId]?.length || 0;
                blade.threadHasPrevious[threadId] = false
            }
        };

        // Modify loadThreadMessages to properly initialize previous replies state
        function loadThreadMessages(threadId, reset = true) {
            $scope.searchMessagesLoading = true;

            var criteria = {
                threadId: threadId,
                entityId: blade.entityId,
                entityType: blade.entityType,
                conversationId: blade.conversationId,
                responseGroup: 'Full',
                skip: reset ? 0 : (blade.threadPagesMap[threadId] - 1) * blade.threadPageSize,
                take: blade.threadPageSize
            };

            api.searchMessages(criteria, function(response) {
                if (response && response.results) {
                    if (reset) {
                        blade.threadsMap[threadId] = response.results;
                    } else {
                        blade.threadsMap[threadId] = blade.threadsMap[threadId].concat(response.results);
                    }

                    // Store total count for this thread
                    blade.threadTotalCounts[threadId] = response.totalCount;

                    // Load user info for messages
                    loadUserInfoForMessages(response.results);
                }
            }).$promise.finally(function() {
                $scope.searchMessagesLoading = false;
            });
        }

        // Helper function to load messages
        function loadMessages(criteria, reset) {
            blade.isLoading = true;

            api.searchMessages(criteria, function(response) {
                if (response && response.results) {
                    if (reset) {
                        blade.messages = response.results;
                    } else {
                        blade.messages = blade.messages.concat(response.results);
                    }

                    // Store total count
                    blade.totalCount = response.totalCount;
                    blade.hasMore = blade.messages.length < response.totalCount;

                    loadUserInfoForMessages(response.results);
                }
            }).$promise.finally(function() {
                blade.isLoading = false;
            });
        }

        // Helper function to load user info
        function loadUserInfoForMessages(messages) {
            var userIds = messages.map(m => m.senderId);
            if (userIds.length) {
                api.getUserInfos({ communicationUserIds: userIds }, function(users) {
                    messages.forEach(message => {
                        var user = users.find(u => u.id === message.senderId);
                        if (user) {
                            message.senderInfo = user;
                        }
                    });
                });
            }
        }

        $scope.hasReplies = function(message) {
            return message.answersCount && message.answersCount > 0;
        };

        $scope.getMessageReplies = function(message) {
            return blade.threadsMap[message.id] || [];
        };

        $scope.markAsRead = function(message) {
            if (!$scope.shouldShowUnreadDot(message)) {
                return;
            }

            // Check if there's a recipient record for current user with 'New' status
            const recipientRecord = message.recipients?.find(r =>
                r.recipientId === $scope.currentUser.id &&
                r.readStatus === 'New'
            );

            // Skip if:
            // - no recipient record exists
            // - message was sent by current user
            // - message is already read
            if (!recipientRecord || message.senderId === $scope.currentUser.id) {
                return;
            }

            api.markRead({ messageId: message.id, recipientId: $scope.currentUser.id }, function() {
                recipientRecord.readStatus = 'Read';
                recipientRecord.readTimestamp = new Date().toISOString();

                // Mark all child messages as read when marking root message
                if (!message.threadId) {
                    var replies = blade.threadsMap[message.id] || [];
                    replies.forEach(function(reply) {
                        const replyRecipient = reply.recipients?.find(r =>
                            r.recipientId === $scope.currentUser.id &&
                            r.readStatus === 'New' &&
                            reply.senderId !== $scope.currentUser.id
                        );

                        if (replyRecipient) {
                            api.markRead({ messageId: reply.id, recipientId: $scope.currentUser.id }, function() {
                                replyRecipient.readStatus = 'Read';
                                replyRecipient.readTimestamp = new Date().toISOString();
                            });
                        }
                    });
                }
                // Mark parent message as read when marking reply
                else {
                    var rootMessage = blade.messages.find(m => m.id === message.threadId);
                    if (rootMessage) {
                        const rootRecipient = rootMessage.recipients?.find(r =>
                            r.recipientId === $scope.currentUser.id &&
                            r.readStatus === 'New' &&
                            rootMessage.senderId !== $scope.currentUser.id
                        );

                        if (rootRecipient) {
                            api.markRead({ messageId: rootMessage.id, recipientId: $scope.currentUser.id }, function() {
                                rootRecipient.readStatus = 'Read';
                                rootRecipient.readTimestamp = new Date().toISOString();
                            });
                        }
                    }
                }
            });
        };

        // Modify refresh to use pagination
        blade.refresh = function() {
            blade.isLoading = true;
            blade.currentPage = 1;
            blade.hasMore = true;

            var criteria = {
                entityId: blade.entityId,
                entityType: blade.entityType,
                conversationId: blade.conversationId,
                rootsOnly: true,
                skip: 0,
                take: blade.pageSize,
                responseGroup: 'Full'
            };

            loadMessages(criteria, true);
            $scope.isInitialLoadComplete = true;
        };

        // Add loadMore function for root messages
        $scope.loadMore = function() {
            if ($scope.isLoadingMore || blade.isScrollingToMessage) return;

            // Calculate if we've loaded all items
            var currentPage = Math.ceil(blade.messages.length / blade.pageSize);
            var totalPages = Math.ceil(blade.totalCount / blade.pageSize);

            if (currentPage >= totalPages) {
                blade.hasMore = false;
                return;
            }

            var criteria = {
                entityId: blade.entityId,
                entityType: blade.entityType,
                conversationId: blade.conversationId,
                rootsOnly: true,
                skip: blade.messages.length,
                take: blade.pageSize,
                responseGroup: 'Full'
            };

            $scope.isLoadingMore = true;

            api.searchMessages(criteria, function(response) {
                if (response && response.results) {
                    if (response.results.length) {
                        blade.messages = blade.messages.concat(response.results);
                        blade.totalCount = response.totalCount;
                        blade.hasMore = blade.messages.length < response.totalCount;

                        loadUserInfoForMessages(response.results);
                    }
                }
            }).$promise.finally(function() {
                $scope.isLoadingMore = false;
            });
        };

        $scope.hasMoreReplies = function(message) {
            var threadId = message.id;
            var currentReplies = blade.threadsMap[threadId] || [];
            var totalCount = blade.threadTotalCounts[threadId] || 0;

            // Check threadHasMore flag
            if (blade.threadHasMore && blade.threadHasMore[threadId] === false) {
                return false;
            }

            return currentReplies.length < totalCount;
        };

        $scope.loadMoreReplies = function(message) {
            var threadId = message.threadId || message.id;
            var currentReplies = blade.threadsMap[threadId] || [];
            if ($scope.threadLoadingStates.more[threadId] || blade.isScrollingToMessage) return;

            var criteria = {
                threadId: threadId,
                entityId: blade.entityId,
                entityType: blade.entityType,
                conversationId: blade.conversationId,
                responseGroup: 'Full',
                skip: currentReplies.length,
                take: blade.threadPageSize,
                sort: 'createdDate:asc'
            };

            $scope.threadLoadingStates.more[threadId] = true;

            api.searchMessages(criteria, function(response) {
                if (response && response.results) {
                    blade.threadsMap[threadId] = (blade.threadsMap[threadId] || []).concat(response.results);
                    blade.threadTotalCounts[threadId] = response.totalCount;

                    // Check if all messages are loaded
                    if (blade.threadsMap[threadId].length >= response.totalCount) {
                        blade.threadHasMore = blade.threadHasMore || {};
                        blade.threadHasMore[threadId] = false;
                    }

                    loadUserInfoForMessages(response.results);
                }
            }).$promise.finally(function() {
                $scope.threadLoadingStates.more[threadId] = false;
            });
        };

        $scope.loadPreviousMessages = function() {
            if ($scope.isLoadingPrevious || blade.isScrollingToMessage) return;

            var criteria = {
                entityId: blade.entityId,
                entityType: blade.entityType,
                conversationId: blade.conversationId,
                rootsOnly: true,
                skip: blade.messages.length,
                take: blade.pageSize,
                responseGroup: 'Full',
                sort: 'createdDate:desc'
            };

            $scope.isLoadingPrevious = true;

            api.searchMessages(criteria, function(response) {
                if (response && response.results) {
                    // Add messages to the beginning of the array
                    blade.messages = response.results.reverse().concat(blade.messages);
                    blade.totalCount = response.totalCount;
                    blade.hasPrevious = blade.messages.length < response.totalCount;

                    loadUserInfoForMessages(response.results);
                }
            }).$promise.finally(function() {
                $scope.isLoadingPrevious = false;
            });
        };

        $scope.loadPreviousReplies = function(message) {
            var threadId = message.threadId || message.id;
            var currentReplies = blade.threadsMap[threadId] || [];
            if ($scope.threadLoadingStates.previous[threadId] || blade.isScrollingToMessage) return;

            var criteria = {
                threadId: threadId,
                entityId: blade.entityId,
                entityType: blade.entityType,
                conversationId: blade.conversationId,
                responseGroup: 'Full',
                skip: currentReplies.length,
                take: blade.threadPageSize,
                sort: 'createdDate:desc'
            };

            $scope.threadLoadingStates.previous[threadId] = true;

            api.searchMessages(criteria, function(response) {
                if (response && response.results) {
                    // Add replies to the beginning of the array
                    blade.threadsMap[threadId] = response.results.reverse().concat(blade.threadsMap[threadId] || []);
                    blade.threadTotalCounts[threadId] = response.totalCount;

                    // Update flag for previous messages
                    blade.threadHasPrevious[threadId] = blade.threadsMap[threadId].length < response.totalCount;

                    loadUserInfoForMessages(response.results);
                }
            }).$promise.finally(function() {
                $scope.threadLoadingStates.previous[threadId] = false;
            });
        };

        $scope.hasPreviousReplies = function(message) {
            var threadId = message.threadId || message.id;
            return blade.threadHasPrevious[threadId] || false;
        };

        function scrollToMessage(messageId) {
            blade.isScrollingToMessage = true;
            $timeout(function() {
                var messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (messageElement) {
                    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Reset scroll flag after animation completes (>1000ms)
                    $timeout(function() {
                        blade.isScrollingToMessage = false;
                    }, 1000);
                } else {
                    blade.isScrollingToMessage = false;
                }
            });
        }

        $scope.sendRootMessage = function() {
            if (!$scope.mainForm.text || !$scope.mainForm.text.trim()) return;

            blade.isLoading = true;
            var sentTime = new Date();
            var messageContent = $scope.mainForm.text.trim();

            var command = {
                message: {
                    content: messageContent,
                    entityId: blade.entityId,
                    entityType: blade.entityType,
                    conversationId: blade.conversationId,
                    senderId: $scope.currentUser.id,
                    recipientId: $scope.messageRecipientId,
                    rootsOnly: true
                }
            };

            api.sendMessage(command, function() {
                $scope.cancelMessage();

                var searchCriteria = {
                    entityId: blade.entityId,
                    entityType: blade.entityType,
                    conversationId: blade.conversationId,
                    rootsOnly: true,
                    responseGroup: 'Full',
                    take: 20,
                    sort: 'createdDate:desc'
                };

                api.searchMessages(searchCriteria, function(response) {
                    if (response && response.results) {
                        blade.messages = response.results.reverse();
                        blade.totalCount = response.totalCount;
                        blade.hasMore = false;
                        blade.hasPrevious = blade.messages.length < response.totalCount;

                        loadUserInfoForMessages(response.results);

                         // Find and scroll to the new message
                         var newMessage = response.results.find(function(msg) {
                            var timeDiff = Math.abs(new Date(msg.createdDate).getTime() - sentTime.getTime());
                            return msg.content === messageContent && timeDiff <= 10000;
                        });

                        if (newMessage) {
                            $scope.mainForm.text = '';
                            scrollToMessage(newMessage.id);
                        }
                    }
                }).$promise.finally(function() {
                    blade.isLoading = false;
                });
            });
        };

        $scope.shouldShowUnreadDot = function(message) {
            if (!message.recipients || message.senderId === $scope.currentUser.id) {
                return false;
            }

            // Find recipient record for current user
            const recipientRecord = message.recipients.find(r =>
                r.recipientId === $scope.currentUser.id
            );

            return recipientRecord && recipientRecord.readStatus === 'New';
        };

        $scope.deleteMessage = function(message) {
            // Get all child messages if this is a root message
            var messageIds = [message.id];
            if (!message.threadId) {
                // If this is a root message, include all replies
                var replies = blade.threadsMap[message.id] || [];
                messageIds = messageIds.concat(replies.map(reply => reply.id));
            }

            var dialog = {
                id: "confirmDeleteMessage",
                title: "marketplaceCommunication.blades.entity-communication.dialogs.delete.title",
                message: "marketplaceCommunication.blades.entity-communication.dialogs.delete.message",
                callback: function(confirm) {
                    if (confirm) {
                        blade.isLoading = true;

                        // Create object with data
                        var data = {
                            messageIds: messageIds,
                        };

                        // Pass data as a parameter
                        api.deleteMessage(data).$promise.then(function() {
                            // If it's a reply, remove it from the thread
                            if (message.threadId) {
                                var threadMessages = blade.threadsMap[message.threadId] || [];
                                var index = threadMessages.findIndex(m => m.id === message.id);
                                if (index !== -1) {
                                    threadMessages.splice(index, 1);

                                    Object.keys(blade.threadsMap).forEach(key => {
                                        const parentMessage = blade.threadsMap[key].find(m => m.id === message.threadId);
                                        if (parentMessage) {
                                            parentMessage.answersCount = (parentMessage.answersCount || 1) - 1;
                                        }
                                    });

                                    // Update the answers count of the parent message
                                    var parentMessage = blade.messages.find(m => m.id === message.threadId);

                                    if (parentMessage) {
                                        parentMessage.answersCount = (parentMessage.answersCount || 1) - 1;
                                    }
                                }
                            }
                            // If it's a root message, remove it and its thread
                            else {
                                var index = blade.messages.findIndex(m => m.id === message.id);
                                if (index !== -1) {
                                    blade.messages.splice(index, 1);
                                    delete blade.threadsMap[message.id];
                                }
                            }
                        }).finally(function() {
                            blade.isLoading = false;
                        });
                    }
                }
            };

            dialogService.showConfirmationDialog(dialog);
        };

        $scope.updateMessage = function(args) {
            if (!args.newContent || !args.newContent.trim()) return;

            blade.isLoading = true;

            var command = {
                messageId: args.message.id,
                content: args.newContent.trim()
            };

            api.updateMessage(command, function(response) {
                // Update message content
                args.message.content = args.newContent.trim();

                // If this is a root message
                if (!args.message.threadId) {
                    var index = blade.messages.findIndex(m => m.id === args.message.id);
                    if (index !== -1) {
                        blade.messages[index].content = args.newContent.trim();
                    }
                }
                // If this is a reply
                else {
                    var threadMessages = blade.threadsMap[args.message.threadId] || [];
                    var replyIndex = threadMessages.findIndex(m => m.id === args.message.id);
                    if (replyIndex !== -1) {
                        threadMessages[replyIndex].content = args.newContent.trim();
                    }
                }
            }).$promise.finally(function() {
                blade.isLoading = false;
            });
        };

        // Add new property to track if we've loaded data at least once
        $scope.isInitialLoadComplete = false;

        // Modify refresh to set isInitialLoadComplete
        blade.refresh = function() {
            blade.isLoading = true;
            blade.currentPage = 1;
            blade.hasMore = true;

            var criteria = {
                entityId: blade.entityId,
                entityType: blade.entityType,
                conversationId: blade.conversationId,
                rootsOnly: true,
                skip: 0,
                take: blade.pageSize,
                responseGroup: 'Full'
            };

            loadMessages(criteria, true);
            $scope.isInitialLoadComplete = true;
        };

        // Add helper method to start conversation
        $scope.startConversation = function() {
            $scope.expandForm();
        };

        initialize();
        blade.refresh();

        $scope.$watch(function() {
            return messageFormsService.activeForm;
        }, function(newFormId) {
            if (newFormId !== 'root' && $scope.isFormExpanded) {
                $scope.mainForm.text = '';
                $scope.isFormExpanded = false;
            }
        });
    }]);
