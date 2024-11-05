import { MaybeComputedElementRef, MaybeElement, useIntersectionObserver } from "@vueuse/core";
import { ref, Ref } from "vue";

interface InfiniteScrollOptions {
  containerRef: Ref<HTMLElement | null>;
  previousLoader: Ref<HTMLElement | null>;
  nextLoader: Ref<HTMLElement | null>;
  onPreviousIntersection: () => Promise<boolean>;
  onNextIntersection: () => Promise<boolean>;
  isProgrammaticScroll: Ref<boolean>;
  hasOlderItems: Ref<boolean>;
  hasNewerItems: Ref<boolean>;
  isLoading: Ref<boolean>;
}

export function useInfiniteScroll({
  containerRef,
  previousLoader,
  nextLoader,
  onPreviousIntersection,
  onNextIntersection,
  isProgrammaticScroll,
  hasOlderItems,
  hasNewerItems,
  isLoading,
}: InfiniteScrollOptions) {
  const previousLoading = ref(false);
  const nextLoading = ref(false);

  // Получаем реальный DOM элемент контейнера
  const getContainerElement = (): MaybeComputedElementRef<MaybeElement> => {
    if (!containerRef.value) return null;
    return "$el" in containerRef.value ? (containerRef.value.$el as HTMLElement) : containerRef.value;
  };

  const { stop: stopTopObserver } = useIntersectionObserver(
    previousLoader,
    ([entry]) => {
      if (
        entry?.isIntersecting &&
        !previousLoading.value &&
        !isProgrammaticScroll.value &&
        hasOlderItems.value &&
        !isLoading.value
      ) {
        handlePreviousLoad();
      }
    },
    {
      root: getContainerElement(),
      rootMargin: "100px 0px 0px 0px",
      threshold: 0.1,
    },
  );

  const { stop: stopBottomObserver } = useIntersectionObserver(
    nextLoader,
    ([entry]) => {
      if (
        entry?.isIntersecting &&
        !nextLoading.value &&
        !isProgrammaticScroll.value &&
        hasNewerItems.value &&
        !isLoading.value
      ) {
        handleNextLoad();
      }
    },
    {
      root: getContainerElement(),
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.1,
    },
  );

  async function handlePreviousLoad() {
    if (previousLoading.value || !hasOlderItems.value || isProgrammaticScroll.value) return;

    const container = getContainerElement();
    if (!container) return;

    previousLoading.value = true;
    try {
      await onPreviousIntersection();
    } finally {
      previousLoading.value = false;
    }
  }

  async function handleNextLoad() {
    if (nextLoading.value || !hasNewerItems.value || isProgrammaticScroll.value) return;

    const container = getContainerElement();
    if (!container) return;

    nextLoading.value = true;
    try {
      await onNextIntersection();
    } finally {
      nextLoading.value = false;
    }
  }

  const cleanup = () => {
    stopTopObserver();
    stopBottomObserver();
  };

  return {
    previousLoading,
    nextLoading,
    cleanup,
  };
}
