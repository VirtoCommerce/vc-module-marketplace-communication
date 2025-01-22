angular.module('virtoCommerce.marketplaceCommunicationModule').component('messageAssets', {
    templateUrl: 'Modules/$(VirtoCommerce.MarketplaceCommunication)/Scripts/components/message-assets.tpl.html',
    bindings: {
        assets: '<',
        isEditing: '<',
        onRemove: '&?'
    },
    controller: [function() {
        var $ctrl = this;

        $ctrl.isAssetsExpanded = false;

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
                { image: "fas fa-file-archive", extensions: ["zip"] },
                { image: "fas fa-file-music", extensions: ["mp3", "aac"] },
                { image: "fas fa-file-video", extensions: ["mp4", "avi"] },
            ];

            return (
                fileThumbnails.find((thumb) => thumb.extensions.some((ext) => ext === $ctrl.getExtension(name)))?.image || "fas fa-file"
            );
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
            if (lastDotIndex === -1) return url;

            const thumbnailUrl = url.substring(0, lastDotIndex) + '_md.' + url.substring(lastDotIndex + 1);

            var img = new Image();
            img.onerror = function() {
                var imgElement = document.querySelector(`img[src="${thumbnailUrl}"]`);
                if (imgElement) {
                    imgElement.src = url;
                }
            };
            img.src = thumbnailUrl;

            return thumbnailUrl;
        };

        $ctrl.getVisibleAssets = function() {
            if ($ctrl.isAssetsExpanded || $ctrl.assets.length <= 3) {
                return $ctrl.assets;
            }
            return $ctrl.assets.slice(0, 3);
        };

        $ctrl.hasHiddenAssets = function() {
            return $ctrl.assets.length > 3;
        };

        $ctrl.getHiddenAssetsCount = function() {
            return $ctrl.assets.length - 3;
        };

        $ctrl.toggleAssetsList = function() {
            $ctrl.isAssetsExpanded = !$ctrl.isAssetsExpanded;
        };
    }]
});
