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
