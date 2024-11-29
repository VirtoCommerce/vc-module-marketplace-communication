angular.module('virtoCommerce.marketplaceCommunicationModule')
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
.controller('virtoCommerce.marketplaceCommunicationModule.messageListController',
    ['$scope', '$timeout', 'virtoCommerce.marketplaceCommunicationModule.webApi',
        'platformWebApp.dialogService', 'messageFormsService',
        'virtoCommerce.marketplaceCommunicationModule.entityTypesResolverService',
        'platformWebApp.bladeNavigationService',
        function ($scope, $timeout, api,
            dialogService, messageFormsService,
            entityTypesResolverService,
            bladeNavigationService) {

        var blade = $scope.blade;
        blade.headIcon = 'fas fa-comment';

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

        // memo
        blade.searchCriteria = null;

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

                if (blade.conversationId) {
                    api.getConversationById({
                        conversationId: blade.conversationId
                    }, function (conversation) {
                        $scope.messageRecipientId = conversation.users?.find(x => x.userId != $scope.currentUser.id)?.userId;
                    });
                }
            });

            if (!blade.conversationId && blade.entityId && blade.entityType) {
                api.getSellerUser({
                    entityId: blade.entityId,
                    entityType: blade.entityType
                }, function (seller) {
                    $scope.sellerUser = seller;
                    $scope.messageRecipientId = seller.id;
                });
            }
        }

        blade.openEntityDetails = function () {
            var entityTemplate = entityTypesResolverService.resolve(blade.entityType);
            if (entityTemplate) {
                var entityBlade = angular.copy(entityTemplate.detailBlade);
                entityBlade[entityTemplate.entityIdFieldName] = blade.entityId;
                if (entityTemplate.getEntity && entityTemplate.entityFieldName) {
                    entityTemplate.getEntity(blade.entityId, function (result) {
                        entityBlade[entityTemplate.entityFieldName] = result;
                        bladeNavigationService.showBlade(entityBlade, blade);
                    })
                }
                else {
                    bladeNavigationService.showBlade(entityBlade, blade);
                }
            } else {
                dialogService.showNotificationDialog({
                    id: "error",
                    title: "marketplaceCommunication.dialogs.unknown-entity-type.title",
                    message: "marketplaceCommunication.dialogs.unknown-entity-type.message",
                    messageValues: { entityType: blade.entityType }
                });
            }
        }


        function createSearchCriteria(options = {}) {
            const defaultCriteria = {
                entityId: blade.entityId,
                entityType: blade.entityType,
                conversationId: blade.conversationId,
                responseGroup: 'Full'
            };

            return { ...defaultCriteria, ...options };
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

            api.sendMessage(command, function () {

                const searchCriteria = createSearchCriteria({
                    threadId: parentMessage.id,
                    take: 10,
                    sort: 'createdDate:desc'
                });

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

            const criteria = createSearchCriteria({
                threadId: threadId,
                skip: reset ? 0 : (blade.threadPagesMap[threadId] - 1) * blade.threadPageSize,
                take: blade.threadPageSize
            });

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
            return message && message.answersCount && message.answersCount > 0;
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
                            r.readStatus === 'New'
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
                            r.readStatus === 'New'
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

            const criteria = createSearchCriteria({
                rootsOnly: true,
                skip: 0,
                take: blade.pageSize
            });

            loadMessages(criteria, true);
            $scope.isInitialLoadComplete = true;
        };

        // Add loadMore function for root messages
        $scope.loadMore = function() {
            if ($scope.isLoadingMore || blade.isScrollingToMessage) return;

            var currentPage = Math.ceil(blade.messages.length / blade.pageSize);
            var totalPages = Math.ceil(blade.totalCount / blade.pageSize);

            if (currentPage >= totalPages) {
                blade.hasMore = false;
                return;
            }

            const criteria = createSearchCriteria({
                rootsOnly: true,
                skip: blade.messages.length,
                take: blade.pageSize
            });

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

            const criteria = createSearchCriteria({
                threadId: threadId,
                skip: currentReplies.length,
                take: blade.threadPageSize,
                sort: 'createdDate:asc'
            });

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
            if ($scope.isLoadingPrevious || blade.isScrollingToMessage) {
                return;
            }

            const criteria = createSearchCriteria({
                rootsOnly: true,
                skip: blade.messages.length,
                take: blade.pageSize,
                sort: 'createdDate:desc'
            });

            $scope.isLoadingPrevious = true;

            api.searchMessages(criteria, function(response) {
                if (response && response.results) {
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

            if ($scope.threadLoadingStates.previous[threadId] || blade.isScrollingToMessage) {
                return;
            }

            const criteria = createSearchCriteria({
                threadId: threadId,
                skip: currentReplies.length,
                take: blade.threadPageSize,
                sort: 'createdDate:desc'
            });

            $scope.threadLoadingStates.previous[threadId] = true;

            api.searchMessages(criteria, function(response) {
                if (response && response.results) {
                    blade.threadsMap[threadId] = response.results.reverse().concat(blade.threadsMap[threadId] || []);
                    blade.threadTotalCounts[threadId] = response.totalCount;
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

                const searchCriteria = createSearchCriteria({
                    rootsOnly: true,
                    take: 20,
                    sort: 'createdDate:desc'
                });

                blade.searchCriteria = angular.copy(searchCriteria);


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
                    // blade.parentBlade.refresh();
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
                title: "marketplaceCommunication.blades.message-list.dialogs.delete.title",
                message: "marketplaceCommunication.blades.message-list.dialogs.delete.message",
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

        $scope.updateMessage = function(params) {

            if (!params || !params.message || !params.newContent) {
                console.error('Invalid params:', params);
                return;
            }

            blade.isLoading = true;

            var command = {
                messageId: params.message.id,
                content: params.newContent.trim()
            };

            api.updateMessage(command, function(response) {
                params.message.content = params.newContent.trim();

                if (!params.message.threadId) {
                    var index = blade.messages.findIndex(m => m.id === params.message.id);
                    if (index !== -1) {
                        blade.messages[index].content = params.newContent.trim();
                    }
                } else {
                    var threadMessages = blade.threadsMap[params.message.threadId] || [];
                    var replyIndex = threadMessages.findIndex(m => m.id === params.message.id);
                    if (replyIndex !== -1) {
                        threadMessages[replyIndex].content = params.newContent.trim();
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

            const criteria = blade.searchCriteria ? angular.copy(blade.searchCriteria) : createSearchCriteria({
                rootsOnly: true,
                skip: 0,
                take: blade.pageSize
            });

            loadMessages(criteria, true);

            blade.searchCriteria = null;
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

