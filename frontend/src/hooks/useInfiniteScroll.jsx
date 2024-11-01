import { useRef, useCallback, useEffect } from 'react';

const useInfiniteScroll = (callback, hasNextPage, isLoading) => {
  const observer = useRef();

  const lastElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      
      // Clean up the previous observer
      if (observer.current) {
        observer.current.disconnect();
      }

      // Create new observer
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            callback();
          }
        },
        {
          root: null,
          rootMargin: '20px', // Load more when item is 20px from viewport
          threshold: 0.1, // Trigger when even 10% of the element is visible
        }
      );

      if (node) {
        observer.current.observe(node);
      }
    },
    [callback, hasNextPage, isLoading]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    const currentObserver = observer.current;
    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, []);

  return lastElementRef;
};

export default useInfiniteScroll;