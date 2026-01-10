import { useState, useMemo, useCallback } from "react";
import { Search, X, UserPlus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * MemberSelector - A searchable user selector component with multi-select support
 * 
 * @param {Object} props
 * @param {Array} props.users - Available users to select from [{_id, username, firstname, lastname, avatar, email}]
 * @param {Array} props.selectedUsers - Currently selected users
 * @param {Function} props.onAdd - Callback when users are added (receives array of user IDs)
 * @param {Function} props.onRemove - Callback when a user is removed (receives user ID)
 * @param {string} props.placeholder - Placeholder text for search input
 * @param {string} props.label - Label for the selector
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @param {boolean} props.showSelectedList - Whether to show selected users as a list below
 * @param {string} props.emptyMessage - Message when no users available
 */
const MemberSelector = ({
  users = [],
  selectedUsers = [],
  onAdd,
  onRemove,
  placeholder = "Search users...",
  label = "Members",
  disabled = false,
  showSelectedList = true,
  emptyMessage = "No users available",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingSelections, setPendingSelections] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Get IDs of already selected users
  const selectedIds = useMemo(() => {
    return selectedUsers.map((u) => u._id || u);
  }, [selectedUsers]);

  // Filter available users (exclude already selected)
  const availableUsers = useMemo(() => {
    return users.filter((user) => !selectedIds.includes(user._id));
  }, [users, selectedIds]);

  // Filter by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    
    const query = searchQuery.toLowerCase();
    return availableUsers.filter((user) => {
      const fullName = `${user.firstname || ""} ${user.lastname || ""}`.toLowerCase();
      return (
        user.username?.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    });
  }, [availableUsers, searchQuery]);

  // Toggle pending selection
  const togglePendingSelection = useCallback((userId) => {
    setPendingSelections((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  }, []);

  // Handle adding selected users
  const handleAddUsers = useCallback(() => {
    if (pendingSelections.length > 0 && onAdd) {
      onAdd(pendingSelections);
      setPendingSelections([]);
      setSearchQuery("");
      setIsOpen(false);
    }
  }, [pendingSelections, onAdd]);

  // Handle removing a user
  const handleRemoveUser = useCallback((userId) => {
    if (onRemove) {
      onRemove(userId);
    }
  }, [onRemove]);

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
    <div className="space-y-3">
      {/* Label and Add Button */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || availableUsers.length === 0}
              className="h-8 gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-0" 
            align="end"
            onInteractOutside={(e) => {
              // Prevent closing when clicking inside
              e.preventDefault();
            }}
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            
            <ScrollArea className="h-[200px]">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery ? "No users found" : emptyMessage}
                </div>
              ) : (
                <div className="p-1">
                  {filteredUsers.map((user) => {
                    const isSelected = pendingSelections.includes(user._id);
                    return (
                      <div
                        key={user._id}
                        onClick={() => togglePendingSelection(user._id)}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                          isSelected
                            ? "bg-primary/10 hover:bg-primary/15"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.username} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          {isSelected && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getDisplayName(user)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {pendingSelections.length > 0 && (
              <div className="p-3 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {pendingSelections.length} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPendingSelections([]);
                      setIsOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddUsers}
                  >
                    Add {pendingSelections.length}
                  </Button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Users List */}
      {showSelectedList && (
        <div className="space-y-2">
          {selectedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No {label.toLowerCase()} added yet
            </p>
          ) : (
            <div className="space-y-1">
              {selectedUsers.map((user) => {
                // Handle both full user objects and just IDs
                const userData = typeof user === "object" ? user : { _id: user, username: "Loading..." };
                return (
                  <div
                    key={userData._id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userData.avatar} alt={userData.username} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(userData)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getDisplayName(userData)}
                        </p>
                        {userData.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {userData.email}
                          </p>
                        )}
                      </div>
                    </div>
                    {!disabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(userData._id)}
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberSelector;
