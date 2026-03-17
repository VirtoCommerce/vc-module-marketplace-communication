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
    ['$scope', '$timeout', '$q', 'virtoCommerce.marketplaceCommunicationModule.webApi',
        'platformWebApp.dialogService', 'messageFormsService',
        'virtoCommerce.marketplaceCommunicationModule.entityTypesResolverService',
        'platformWebApp.bladeNavigationService',
        function ($scope, $timeout, $q, api,
            dialogService, messageFormsService,
            entityTypesResolverService,
            bladeNavigationService) {

        var blade = $scope.blade;
        blade.headIcon = 'fas fa-comment';

        blade.messages = [];
        $scope.selectedMessageId = null;
        $scope.currentUser = null;
        $scope.isLoading = false;
        $scope.searchMessagesLoading = false;

        // Form for root message
        $scope.mainForm = {
            text: '',
            attachments: []
        };

        // Add pagination state
        blade.pageSize = 10;
        blade.currentPage = 1;
        blade.hasMore = true;

        // Add totalCount tracking
        blade.totalCount = 0;

        // Add flags for reverse scrolling
        blade.hasPrevious = false;

        // Add flag for programmatic scrolling
        blade.isScrollingToMessage = false;

        // Add new loading states
        $scope.isLoadingPrevious = false;  // For top scroll of root messages
        $scope.isLoadingMore = false;      // For bottom scroll of root messages

        // memo
        blade.searchCriteria = null;

        // Add this line to initialize the form state
        $scope.isFormExpanded = false;

        // Initialize the form object if it doesn't exist
        $scope.mainForm = $scope.mainForm || {};

        $scope.communicationSettings = null;

        // Quotes cache for lazy-loaded quoted messages
        var quotesCache = {};

        // Reply-to state
        $scope.replyToMessage = null;

        $scope.setReplyTo = function(message) {
            $scope.replyToMessage = message;
            messageFormsService.openForm('root');
        };

        $scope.cancelReply = function() {
            $scope.replyToMessage = null;
        };

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
            $scope.mainForm.attachments = [];
            $scope.isFormExpanded = false;
            $scope.replyToMessage = null;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        function initialize() {
            api.getCommunicationSettings(function(response) {
                $scope.communicationSettings = response;
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


        // Helper function to load messages
        function loadMessages(criteria, reset) {
            blade.isLoading = true;
            if (blade.exactlyMessageId) {
                api.getMessage({ messageId: blade.exactlyMessageId, responseGroup: "WithSender" }, function (message) {
                    if (message) {
                        blade.messages = [message];
                        loadUserInfoForMessages(blade.messages);
                        blade.isLoading = false;
                    }
                    else {
                        blade.isLoading = false;
                    }
                }).$promise.finally(function () {
                });
            }
            else {
                api.searchMessages(criteria, function (response) {
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
                }).$promise.finally(function () {
                    blade.isLoading = false;
                });
            }
        }

        blade.showAllThreads = function () {
            blade.exactlyMessageId = undefined;
            blade.refresh();
        };

        // Helper function to load user info
        function loadUserInfoForMessages(messages) {
            var userIds = _.uniq(_.compact(_.map(messages, 'senderId')));
            if (!userIds.length) return $q.resolve();

            return api.getUserInfos({ communicationUserIds: userIds }).$promise.then(function(users) {
                angular.forEach(messages, function(message) {
                    var user = _.find(users, { id: message.senderId });
                    if (user) {
                        message.senderInfo = user;
                    }
                });
            });
        }

        // Lazy-fetch a quoted message by ID
        function getQuotedMessage(messageId) {
            // 1. Check loaded messages
            var found = blade.messages.find(function(m) { return m.id === messageId; });
            if (found) return $q.resolve(found);

            // 2. Check cache
            if (quotesCache[messageId]) return $q.resolve(quotesCache[messageId]);

            // 3. Lazy fetch via getThread API
            return api.getThread({ threadId: messageId }).$promise.then(function(result) {
                var chain = result.results || result;
                if (chain && chain.length) {
                    return loadUserInfoForMessages(chain).then(function() {
                        angular.forEach(chain, function(msg) {
                            if (msg.id) quotesCache[msg.id] = msg;
                        });
                        return _.find(chain, { id: messageId }) || null;
                    });
                }
                return null;
            }).catch(function() {
                return null;
            });
        }

        $scope.getQuotedMessage = getQuotedMessage;

        $scope.markAsRead = function(message) {
            if (!$scope.shouldShowUnreadDot(message)) {
                return;
            }

            // Check if there's a recipient record for current user with 'New' status
            const recipientRecord = message.recipients?.find(r =>
                r.recipientId === $scope.currentUser.id &&
                r.readStatus === 'New'
            );

            // Skip if no recipient record exists
            if (!recipientRecord) {
                return;
            }

            api.markRead({ messageId: message.id, recipientId: $scope.currentUser.id }, function() {
                recipientRecord.readStatus = 'Read';
                recipientRecord.readTimestamp = new Date().toISOString();
                blade.parentBlade.refresh(false);
            });
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

        $scope.loadPreviousMessages = function() {
            if ($scope.isLoadingPrevious || blade.isScrollingToMessage) {
                return;
            }

            const criteria = createSearchCriteria({
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

        function scrollToMessage(messageId) {
            blade.isScrollingToMessage = true;
            $timeout(function() {
                var el = document.querySelector('[data-message-id="' + messageId + '"]');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('message-bubble--highlight');
                    $timeout(function() {
                        el.classList.remove('message-bubble--highlight');
                        blade.isScrollingToMessage = false;
                    }, 2000);
                } else {
                    blade.isScrollingToMessage = false;
                }
            });
        }

        $scope.scrollToMessage = scrollToMessage;

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
                    attachments: $scope.mainForm.attachments
                }
            };

            // Attach replyTo if replying to a message
            if ($scope.replyToMessage) {
                command.message.replyTo = $scope.replyToMessage.id;
            }

            api.sendMessage(command, function() {
                $scope.cancelMessage();

                const searchCriteria = createSearchCriteria({
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
                    $scope.replyToMessage = null;
                    blade.parentBlade.refresh(false);
                });
            });
        };

        $scope.shouldShowUnreadDot = function(message) {
            if (!message) {
                return false;
            }

            if (!message.recipients) {
                return false;
            }

            // Find recipient record for current user
            const recipientRecord = message.recipients.find(r =>
                r.recipientId === $scope.currentUser.id
            );

            return recipientRecord && recipientRecord.readStatus === 'New';
        };

        $scope.deleteMessage = function(message) {
            var messageIds = [message.id];

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
                            var index = blade.messages.findIndex(m => m.id === message.id);
                            if (index !== -1) {
                                blade.messages.splice(index, 1);
                            }
                        }).finally(function() {
                            blade.isLoading = false;
                            blade.parentBlade.refresh(false);
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
                content: params.newContent.trim(),
                attachments: params.attachments
            };

            api.updateMessage(command, function(response) {
                params.message.content = params.newContent.trim();
                params.message.attachments = params.attachments;

                var index = blade.messages.findIndex(m => m.id === params.message.id);
                if (index !== -1) {
                    blade.messages[index].content = params.newContent.trim();
                    blade.messages[index].attachments = params.attachments;
                }
            }).$promise.finally(function() {
                blade.isLoading = false;
                blade.parentBlade.refresh(false);
            });
        };

        // Add new property to track if we've loaded data at least once
        $scope.isInitialLoadComplete = false;

        // Modify refresh to set isInitialLoadComplete
        blade.refresh = function() {
            blade.isLoading = true;
            blade.currentPage = 1;
            blade.hasMore = true;
            quotesCache = {};

            const criteria = blade.searchCriteria ? angular.copy(blade.searchCriteria) : createSearchCriteria({
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
                $scope.mainForm.attachments = [];
                $scope.isFormExpanded = false;
            }
        });
    }]);
