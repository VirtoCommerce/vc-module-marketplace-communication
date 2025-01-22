angular.module('virtoCommerce.marketplaceCommunicationModule').component('messageComposer', {
    templateUrl: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/components/message-composer.tpl.html',
    bindings: {
        isExpanded: '=',
        message: '=',
        isLoading: '=',
        onSend: '&',
        onCancel: '&',
        onExpand: '&'
    },
    controller: ['$scope', 'FileUploader', 'platformWebApp.bladeNavigationService',
    function($scope, FileUploader, bladeNavigationService) {
        var $ctrl = this;

        // Asset management
        $ctrl.isAssetsExpanded = false;

        function initializeUploader() {
            var uploader = $scope.uploader = new FileUploader({
                scope: $scope,
                headers: { Accept: 'application/json' },
                method: 'POST',
                autoUpload: true,
                removeAfterUpload: true,
                url: 'api/assets?folderUrl=messenger/' + ($ctrl.message ? ($ctrl.message.entityId && $ctrl.message.entityType ? `${$ctrl.message.entityType}/${$ctrl.message.entityId}` : $ctrl.message.conversationId ? `${$ctrl.message.conversationId}` : '') : '')
            });

            uploader.onSuccessItem = function (fileItem, assets, status, headers) {
                angular.forEach(assets, function (asset) {
                    $ctrl.message.attachments.push({
                        attachmentUrl: asset.url,
                        fileName: asset.name,
                        fileType: asset.name?.toLowerCase().split(".").pop(),
                        fileSize: asset.fileSize,
                    });
                });

            };

            uploader.onAfterAddingAll = function (addedItems) {
                bladeNavigationService.setError(null, $scope.blade);
            };

            uploader.onErrorItem = function (item, response, status, headers) {
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

        $ctrl.isImage = function(name) {
            if (!name) return false;
            const imageExtensions = new Set(["png", "jpg", "jpeg", "svg", "gif", ".webp"]);
            return imageExtensions.has($ctrl.getExtension(name));
        };

        $ctrl.getExtension = function(fileName) {
            return fileName.split(".").pop()?.toLowerCase();
        };

        $ctrl.getFileIcon = function(name) {
            if (!name) return 'fa-file';

            const fileThumbnails = [
                { image: "fas fa-file-pdf", extensions: ["pdf"] },
                { image: "fas fa-file-word", extensions: ["doc", "docx"] },
                { image: "fas fa-file-excel", extensions: ["xls", "xlsx"] },
                { image: "fas fa-file-powerpoint", extensions: ["ppt", "pptx"] },
                { image: "fas fa-file-csv", extensions: ["csv"] },
                { image: "fas fa-file-archive", extensions: ["zip"] },
                { image: "fas fa-file-music", extensions: ["mp3", "aac"] },
                { image: "fas fa-file-video", extensions: ["mp4", "avi"] },
              ];

              return (
                fileThumbnails.find((thumb) => thumb.extensions.some((ext) => ext === $ctrl.getExtension(name)))?.image || "fas fa-file"
              );
        };

        // Initialize uploader on component init
        initializeUploader();
    }]
});
