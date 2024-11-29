angular.module('virtoCommerce.marketplaceCommunicationModule')
    .controller('virtoCommerce.marketplaceCommunicationModule.conversationDetailsController', ['$scope',
        'platformWebApp.bladeUtils', 'platformWebApp.bladeNavigationService',
        'virtoCommerce.marketplaceCommunicationModule.webApi',
        function ($scope,
            bladeUtils, bladeNavigationService,
            communicationApi) {

            var blade = $scope.blade;
            blade.headIcon = 'fas fa-comment';
            blade.title = 'marketplaceCommunication.blades.conversation-details.title';

            blade.refresh = function () {
                blade.isLoading = true;
                blade.currentEntity = blade.conversation;
                blade.origEntity = angular.copy(blade.currentEntity);
                blade.isLoading = false;
            }

            blade.toolbarCommands = [
                {
                    name: "platform.commands.save", icon: 'fas fa-save',
                    executeMethod: function () {
                        $scope.saveChanges();
                    },
                    canExecuteMethod: function () {
                        return isDirty();
                    }
                },
                {
                    name: "platform.commands.reset", icon: 'fa fa-undo',
                    executeMethod: function () {
                        angular.copy(blade.origEntity, blade.currentEntity);
                    },
                    canExecuteMethod: isDirty
                }
            ];

            $scope.saveChanges = function () {
                communicationApi.updateConversation({ conversation: blade.currentEntity },
                    function (data) {
                        blade.refresh();
                        blade.parentBlade.refresh();
                    },
                    function (error) { bladeNavigationService.setError('Error ' + error.status, blade); });
            };

            $scope.setForm = function (form) { $scope.formScope = form; }

            function isDirty() {
                return !angular.equals(blade.currentEntity, blade.origEntity);
            }

            var originalBlade;
            blade.uploadLogo = function () {
                var newBlade = {
                    id: "logoUpload",
                    currentEntityId: 'conversation_icons',
                    title: 'platform.blades.asset-upload.title',
                    subtitle: blade.currentEntity.name,
                    controller: 'virtoCommerce.assetsModule.assetUploadController',
                    template: 'Modules/$(VirtoCommerce.Assets)/Scripts/blades/asset-upload.tpl.html',
                    fileUploadOptions: {
                        singleFileMode: true,
                        accept: "image/*",
                        suppressParentRefresh: true
                    }
                };
                newBlade.onUploadComplete = function (data) {
                    if (data && data.length) {
                        blade.currentEntity.iconUrl = data[0].url;
                        bladeNavigationService.closeBlade(newBlade);
                    }
                }

                //saving orig blade reference (that is not imageUpload blade) for subsequent showBlade calls
                if (!originalBlade) {
                    originalBlade = bladeNavigationService.currentBlade.id !== "logoUpload" ? bladeNavigationService.currentBlade : bladeNavigationService.currentBlade.parentBlade;
                }
                bladeNavigationService.showBlade(newBlade, originalBlade);
            }

            blade.clearLogo = function () {
                blade.currentEntity.iconUrl = undefined;
            }

            blade.refresh();
        }
    ]);
