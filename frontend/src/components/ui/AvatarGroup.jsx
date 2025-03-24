import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const AvatarGroup = ({
  users,
  limit = 3,
  avatarType = "Users",
  onUserClick,
  size = "default",
  shoudlShowFilters = true,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterRole, setFilterRole] = React.useState("All");

  const visibleUsers = users.slice(0, limit);
  const remainingCount = users.length - limit;

  const sizeClasses = {
    small: "h-8 w-8 -space-x-3",
    medium: "h-9 w-9 -space-x-4",
    default: "h-10 w-10 -space-x-4",
    large: "h-12 w-12 -space-x-5",
  };

  const stackClasses = {
    small: "-space-x-3",
    medium: "-space-x-4",
    default: "-space-x-4",
    large: "-space-x-5",
  };

  const fontSizeClasses = {
    small: "text-xs",
    medium: "text-xs",
    default: "text-base",
    large: "text-lg",
  };

  const getRoleBadgeClasses = (role) => {
    switch (role?.toLowerCase()) {
      case "manager":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500 hover:bg-green-200 dark:hover:bg-green-800/30";
      case "member":
        return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-500 hover:bg-cyan-200 dark:hover:bg-cyan-800/30";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/30";
    }
  };

  const filteredUsers = users
    .filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((user) => (filterRole === "All" ? true : user.role === filterRole));

  const resetFilters = () => {
    setSearchQuery("");
    setFilterRole("All");
  };

  // Render Filters
  const renderFilters = () => {
    return (
      <>
        {/* Role Filter Buttons */}
        <div className="flex gap-2 my-1">
          {["All", "Manager", "Member"].map((role) => (
            <Button
              key={role}
              size="xs"
              variant={filterRole === role ? "solid" : "outline"}
              className={`px-3 py-1 text-sm ${
                filterRole === role
                  ? "bg-slate-500 dark:bg-slate-600 text-gray-200 dark:text-slate-200 border-slate-500 dark:border-slate-600"
                  : "bg-transparent text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800/50"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setFilterRole(role);
              }}
            >
              {role}
            </Button>
          ))}

          {/* Reset Button */}
          {(searchQuery || filterRole !== "All") && (
            <Button
              size="xs"
              variant="outline"
              className="px-3 py-1 text-sm bg-transparent text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800/50"
              onClick={(e) => {
                e.stopPropagation();
                resetFilters();
              }}
            >
              {/* Icon for reset */}
              <RefreshCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${avatarType.toLowerCase()}...`}
            className="w-full rounded-md border border-slate-200 dark:border-slate-700 pl-8 pr-4 py-2 text-sm 
                  bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-500 dark:focus:ring-slate-400
                  text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </>
    );
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Popover>
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          <div
            className={`flex relative cursor-pointer ${stackClasses[size]} popover-trigger`}
          >
            {visibleUsers.map((user, index) => (
              <Tooltip key={user._id}>
                <TooltipTrigger>
                  <Avatar
                    className={`${sizeClasses[size]} border-2 border-white dark:border-slate-800 
                        bg-white dark:bg-slate-900 transition-all duration-200 hover:ring-1 
                        hover:ring-slate-500/50 dark:hover:ring-slate-400/30`}
                    style={{
                      zIndex: visibleUsers.length - index,
                      transform: "scale(1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.zIndex = 1000;
                      e.currentTarget.style.transform =
                        "scale(1.1) translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.zIndex =
                        visibleUsers.length - index;
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <AvatarImage
                      src={user.avatar}
                      alt={user.username}
                      className="object-cover"
                    />
                    <AvatarFallback
                      className={`bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-200 ${fontSizeClasses[size]}`}
                    >
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent
                  sideOffset={10}
                  className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-800"
                >
                  <p className="font-medium">{user.username}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {remainingCount > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Avatar
                    className={`${sizeClasses[size]} border-2 border-white dark:border-slate-800 
                    bg-white dark:bg-slate-900 transition-all duration-200 hover:ring-1 
                    hover:ring-slate-500/50 dark:hover:ring-slate-400/50`}
                    style={{
                      zIndex: 0,
                      transform: "scale(1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.zIndex = 1000;
                      e.currentTarget.style.transform =
                        "scale(1.1) translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.zIndex = 0;
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-200 font-medium">
                      +{remainingCount}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent
                  sideOffset={10}
                  className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-800"
                >
                  <p>
                    +{remainingCount} more {avatarType.toLowerCase()}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          onClick={(e) => e.stopPropagation()}
          className="w-80 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                All {avatarType}
                <Badge
                  variant="secondary"
                  className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {users.length}
                </Badge>
              </h4>
            </div>

            {shoudlShowFilters && renderFilters()}

            <ScrollArea className="h-[250px] pr-4 w-[105%]">
              <div className="space-y-1">
                {filteredUsers.length > 0 &&
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUserClick?.(user);
                      }}
                      className="flex items-center justify-between gap-3 p-2 hover:bg-gray-100/70 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={user.avatar}
                              alt={user.username}
                              className="object-cover"
                            />
                            <AvatarFallback
                              className="bg-gradient-to-br from-slate-100 to-slate-200 
                            dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 font-medium"
                            >
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {user.username}
                          </span>
                          {user.email && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 max-w-32 truncate">
                              {user.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {user.role && (
                        <Badge
                          variant="secondary"
                          className={`transition-opacity ${getRoleBadgeClasses(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  ))}
                {filteredUsers.length === 0 && (
                  <p className="px-2 text-sm text-slate-500 dark:text-slate-400">
                    No users found
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

export default AvatarGroup;
