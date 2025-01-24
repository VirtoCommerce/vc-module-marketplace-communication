angular.module('virtoCommerce.marketplaceCommunicationModule').component('messageComposer', {
    templateUrl: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/components/message-composer.tpl.html',
    bindings: {
        isExpanded: '=',
        message: '=',
        isLoading: '=',
        onSend: '&',
        onCancel: '&',
        onExpand: '&',
        conversationId: '=',
        entityId: '=',
        entityType: '=',
        settings: '<'
    },
    controller: ['$scope', 'FileUploader', 'platformWebApp.bladeNavigationService', 'platformWebApp.dialogService', 'marketplaceCommunicationConstants',
    function($scope, FileUploader, bladeNavigationService, dialogService, constants) {
        var $ctrl = this;
        var uploader;

        $ctrl.$onInit = function() {
            $ctrl.isAssetsExpanded = false;
            $ctrl.uploadError = '';
            if (!$ctrl.message) {
                $ctrl.message = { text: '', attachments: [] };
            }
            if (!$ctrl.message.attachments) {
                $ctrl.message.attachments = [];
            }

            // Get allowed file types
            $scope.allowedFileTypes = constants.getAllowedFileTypes();

            initializeUploader();
        };

        $ctrl.$onChanges = function(changes) {
            if (changes.settings && changes.settings.currentValue) {
                if (!uploader) {
                    initializeUploader();
                }
            }
            if ((changes.conversationId || changes.entityId || changes.entityType) && uploader) {
                updateUploaderUrl();
            }
        };

        function getUploaderUrl() {
            var baseUrl = 'api/assets?folderUrl=messenger';
            if ($ctrl.entityId && $ctrl.entityType) {
                return baseUrl + '/' + $ctrl.entityType + '/' + $ctrl.entityId;
            } else if ($ctrl.conversationId) {
                return baseUrl + '/' + $ctrl.conversationId;
            }
            return baseUrl;
        }

        function updateUploaderUrl() {
            uploader.url = getUploaderUrl();
        }

        function initializeUploader() {
            uploader = $scope.uploader = new FileUploader({
                scope: $scope,
                headers: { Accept: 'application/json' },
                method: 'POST',
                autoUpload: false,
                removeAfterUpload: true,
                url: getUploaderUrl()
            });

            uploader.filters.push({
                name: 'fileTypeCheck',
                fn: function(item) {
                    var allowedExtensions = $scope.allowedFileTypes.split(',').map(function(ext) {
                        return ext.toLowerCase().replace('.', '');
                    });

                    var fileExtension = item.name.split('.').pop().toLowerCase();
                    var isAllowed = allowedExtensions.includes(fileExtension);

                    if (!isAllowed) {
                        $ctrl.uploadError = {
                            fileName: item.name,
                            type: 'extension'
                        };
                        $scope.$apply();
                        return false;
                    }
                    return true;
                }
            });

            uploader.filters.push({
                name: 'limitCheck',
                fn: function(item) {
                    var totalCount = $ctrl.message.attachments.length + uploader.queue.length + 1;
                    if (totalCount > $ctrl.settings.attachmentCountLimit) {
                        dialogService.showNotificationDialog({
                            id: "attachmentCountLimitExceeded",
                            title: "marketplaceCommunication.dialogs.attachment-count-limit.title",
                            message: "marketplaceCommunication.dialogs.attachment-count-limit.message",
                            messageValues: { limit: $ctrl.settings.attachmentCountLimit }
                        });

                        return false;
                    }

                    var totalSize = $ctrl.message.attachments.reduce((sum, asset) => sum + (asset.fileSize || 0), 0);
                    totalSize += uploader.queue.reduce((sum, queuedItem) => sum + queuedItem.file.size, 0);
                    totalSize += item.size;
                    var totalSizeMB = totalSize / (1024 * 1024);

                    if (totalSizeMB > $ctrl.settings.attachmentSizeLimit) {
                        dialogService.showNotificationDialog({
                            id: "attachmentSizeLimitExceeded",
                            title: "marketplaceCommunication.dialogs.attachment-size-limit.title",
                            message: "marketplaceCommunication.dialogs.attachment-size-limit.message",
                            messageValues: {
                                limit: $ctrl.settings.attachmentSizeLimit,
                                size: totalSizeMB.toFixed(2)
                            }
                        });

                        return false;
                    }

                    return true;
                }
            });

            uploader.filters.push({
                name: 'duplicateCheck',
                fn: function(item) {
                    var isDuplicate = $ctrl.message.attachments.some(function(asset) {
                        return asset.fileName.toLowerCase() === item.name.toLowerCase();
                    });

                    if (isDuplicate) {
                        $ctrl.uploadError = {
                            fileName: item.name
                        };
                        $scope.$apply();
                        return false;
                    }

                    $ctrl.uploadError = null;
                    return true;
                }
            });

            uploader.onAfterAddingAll = function(addedItems) {
                if (addedItems && addedItems.length) {
                    uploader.uploadAll();
                }
            };

            uploader.onSuccessItem = function(fileItem, assets, status, headers) {
                $ctrl.uploadError = '';
                angular.forEach(assets, function(asset) {
                    $ctrl.message.attachments.push({
                        attachmentUrl: asset.url,
                        fileName: asset.name,
                        fileType: asset.name?.toLowerCase().split(".").pop(),
                        fileSize: fileItem.file.size,
                    });
                });
                $scope.$apply();
            };

            uploader.onErrorItem = function(item, response, status, headers) {
                uploader.clearQueue();
                bladeNavigationService.setError(item._file.name + ' failed: ' + (response.message ? response.message : status), $scope.blade);
            };
        }

        $ctrl.handleKeyPress = function(event) {
            if (event.keyCode === 13 && !event.shiftKey) {
                event.preventDefault();
                if ($ctrl.message && !$ctrl.isLoading) {
                    $ctrl.onSend();
                }
            }
        };

        $ctrl.truncateFileName = function(fileName) {
            if (!fileName) return '';
            const maxLength = 20;
            const lastDotIndex = fileName.lastIndexOf('.');
            if (lastDotIndex === -1) return fileName;
            const name = fileName.slice(0, lastDotIndex);
            const extension = fileName.slice(lastDotIndex);
            if (fileName.length <= maxLength) return fileName;
            const truncatedLength = maxLength - extension.length - 1;

            return `${name.slice(0, truncatedLength)}...${extension}`;
        };

        $ctrl.createThumbnailLink = function(url) {
            if (!url) return '';
            const lastDotIndex = url.lastIndexOf('.');
            return lastDotIndex !== -1 ? url.substring(0, lastDotIndex) + '_md.' + url.substring(lastDotIndex + 1) : '';
        };

        $ctrl.openFileSelect = function() {
            var fileInput = document.querySelector('.message-composer__file-input');
            if (fileInput) {
                fileInput.click();
            }
        };

        $ctrl.removeAsset = function(asset) {
            const index = $ctrl.message.attachments.indexOf(asset);
            if (index > -1) {
                $ctrl.message.attachments.splice(index, 1);
            }
        };

        $ctrl.getVisibleAssets = function() {
            if ($ctrl.isAssetsExpanded || $ctrl.message.attachments.length <= 3) {
                return $ctrl.message.attachments;
            }
            return $ctrl.message.attachments.slice(0, 3);
        };

        $ctrl.hasHiddenAssets = function() {
            return $ctrl.message.attachments.length > 3;
        };

        $ctrl.getHiddenAssetsCount = function() {
            return $ctrl.message.attachments.length - 3;
        };

        $ctrl.toggleAssetsList = function() {
            $ctrl.isAssetsExpanded = !$ctrl.isAssetsExpanded;
        };
    }]
});
