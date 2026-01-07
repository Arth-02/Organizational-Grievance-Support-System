import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, children, ...props }, ref) => {
  const [indicatorStyle, setIndicatorStyle] = React.useState({ opacity: 0 });
  const listRef = React.useRef(null);
  const combinedRef = (node) => {
    listRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  React.useEffect(() => {
    const updateIndicator = () => {
      if (!listRef.current) return;
      const activeTab = listRef.current.querySelector('[data-state="active"]');
      if (activeTab) {
        setIndicatorStyle({
          width: activeTab.offsetWidth,
          left: activeTab.offsetLeft,
          opacity: 1,
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateIndicator, 10);
    
    // Use MutationObserver to detect active tab changes
    const observer = new MutationObserver(updateIndicator);
    if (listRef.current) {
      observer.observe(listRef.current, { attributes: true, subtree: true, attributeFilter: ['data-state'] });
    }
    window.addEventListener('resize', updateIndicator);
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [children]);

  return (
    <TabsPrimitive.List
      ref={combinedRef}
      className={cn(
        "relative inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-card border border-border p-1",
        className
      )}
      {...props}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-md bg-primary shadow-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={indicatorStyle}
      />
      {children}
    </TabsPrimitive.List>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium",
      "transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
      "text-muted-foreground",
      "hover:text-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:text-primary-foreground",
      className
    )}
    {...props} />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
