import { useCallback, useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, X, CheckSquare, Bug, BookOpen, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { setProjectFilters, resetProjectFilters } from "@/features/projectSlice";
import { useGetProjectMembersQuery } from "@/services/project.service";
import debounce from "lodash/debounce";
import { cn } from "@/lib/utils";

// Task type configuration
const TASK_TYPE_OPTIONS = [
  { value: "task", label: "Task", icon: CheckSquare, color: "text-blue-500" },
  { value: "bug", label: "Bug", icon: Bug, color: "text-red-500" },
  { value: "story", label: "Story", icon: BookOpen, color: "text-green-500" },
  { value: "epic", label: "Epic", icon: Zap, color: "text-purple-500" },
];

// Priority configuration
const PRIORITY_OPTIONS = [
  { value: "lowest", label: "Lowest", badge: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400" },
  { value: "low", label: "Low", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
  { value: "medium", label: "Medium", badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" },
  { value: "high", label: "High", badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" },
  { value: "highest", label: "Highest", badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
];

// My Tasks filter options
const MY_FILTER_OPTIONS = [
  { value: "all", label: "All Tasks" },
  { value: "assigned_to_me", label: "Assigned to me" },
  { value: "reported_by_me", label: "Reported by me" },
];

/**
 * TaskFilters - Filter controls for the task board
 * 
 * @param {Object} props
 * @param {string} props.projectId - The project ID to fetch members for
 */
const TaskFilters = ({ projectId }) => {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.project.filters);
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);

  // Fetch project members for assignee filter
  const { data: membersData } = useGetProjectMembersQuery(projectId, {
    skip: !projectId,
  });

  const members = useMemo(() => {
    return membersData?.data || [];
  }, [membersData]);

  // Sync search input with Redux state
  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        dispatch(setProjectFilters({ search: value }));
      }, 300),
    [dispatch]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    dispatch(setProjectFilters({ search: "" }));
  }, [dispatch]);

  const handleAssigneeChange = useCallback(
    (userId) => {
      dispatch(setProjectFilters({ assignee: userId }));
      setAssigneePopoverOpen(false);
    },
    [dispatch]
  );

  const handlePriorityChange = useCallback(
    (value) => {
      dispatch(setProjectFilters({ priority: value === "all" ? null : value }));
    },
    [dispatch]
  );

  const handleTypeChange = useCallback(
    (value) => {
      dispatch(setProjectFilters({ type: value === "all" ? null : value }));
    },
    [dispatch]
  );

  const handleMyFilterChange = useCallback(
    (value) => {
      dispatch(setProjectFilters({ myFilter: value }));
    },
    [dispatch]
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    dispatch(resetProjectFilters());
  }, [dispatch]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search ||
      filters.assignee ||
      filters.priority ||
      filters.type ||
      filters.myFilter !== "all"
    );
  }, [filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.assignee) count++;
    if (filters.priority) count++;
    if (filters.type) count++;
    if (filters.myFilter !== "all") count++;
    return count;
  }, [filters]);

  // Get selected assignee details
  const selectedAssignee = useMemo(() => {
    if (!filters.assignee) return null;
    return members.find((m) => m._id === filters.assignee);
  }, [filters.assignee, members]);

  // Get display name for a user
  const getDisplayName = (user) => {
    if (user.firstname && user.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    return user.username || "Unknown User";
  };

  // Get initials for avatar fallback
  const getInitials = (user) => {
    if (user.firstname && user.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    return user.username?.slice(0, 2).toUpperCase() || "??";
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tasks..."
          value={searchInput}
          onChange={handleSearchChange}
          className="pl-8 h-9 w-[180px]"
        />
        {searchInput && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Assignee Filter */}
      <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-2",
              filters.assignee && "border-primary/50 bg-primary/5"
            )}
          >
            {selectedAssignee ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selectedAssignee.avatar} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(selectedAssignee)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[100px] truncate">
                  {getDisplayName(selectedAssignee)}
                </span>
              </>
            ) : (
              "Assignee"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <ScrollArea className="h-[250px]">
            <div className="p-1">
              {/* Clear option */}
              <div
                onClick={() => handleAssigneeChange(null)}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                  !filters.assignee ? "bg-primary/10" : "hover:bg-muted"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">All</span>
                </div>
                <span className="text-sm">All Assignees</span>
              </div>

              {/* Member options */}
              {members.map((member) => (
                <div
                  key={member._id}
                  onClick={() => handleAssigneeChange(member._id)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                    filters.assignee === member._id
                      ? "bg-primary/10"
                      : "hover:bg-muted"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} alt={member.username} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getDisplayName(member)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{member.username}
                    </p>
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No members found
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Priority Filter */}
      <Select
        value={filters.priority || "all"}
        onValueChange={handlePriorityChange}
      >
        <SelectTrigger
          className={cn(
            "h-9 w-[130px]",
            filters.priority && "border-primary/50 bg-primary/5"
          )}
        >
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {PRIORITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[10px] px-1.5 py-0", option.badge)}>
                  {option.label}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type Filter */}
      <Select value={filters.type || "all"} onValueChange={handleTypeChange}>
        <SelectTrigger
          className={cn(
            "h-9 w-[120px]",
            filters.type && "border-primary/50 bg-primary/5"
          )}
        >
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {TASK_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", option.color)} />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* My Tasks Filter */}
      <Select value={filters.myFilter} onValueChange={handleMyFilterChange}>
        <SelectTrigger
          className={cn(
            "h-9 w-[150px]",
            filters.myFilter !== "all" && "border-primary/50 bg-primary/5"
          )}
        >
          <SelectValue placeholder="My Tasks" />
        </SelectTrigger>
        <SelectContent>
          {MY_FILTER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Clear
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
};

export default TaskFilters;
