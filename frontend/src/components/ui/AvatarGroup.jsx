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
import { Search } from "lucide-react";

const AvatarGroup = ({
  users,
  limit = 3,
  avatarType = "Users",
  onUserClick,
  size = "default",
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const visibleUsers = users.slice(0, limit);
  const remainingCount = users.length - limit;

  const sizeClasses = {
    small: "h-8 w-8 -space-x-3",
    default: "h-10 w-10 -space-x-4",
    large: "h-12 w-12 -space-x-5",
  };

  const stackClasses = {
    small: "-space-x-3",
    default: "-space-x-4",
    large: "-space-x-5",
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TooltipProvider delayDuration={100}>
      <Popover>
        <PopoverTrigger asChild>
          <div className={`flex relative cursor-pointer ${stackClasses[size]}`}>
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
                    <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent
                  sideOffset={10}
                  className="dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
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
                    <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                      +{remainingCount}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent
                  sideOffset={10}
                  className="dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
                >
                  <p>
                    +{remainingCount} more {avatarType.toLowerCase()}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800">
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

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 pl-8 pr-4 py-2 text-sm 
                  bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-500 dark:focus:ring-slate-400
                  text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-1">
                {filteredUsers.length > 0 &&
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => onUserClick?.(user)}
                      className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 
                      rounded-lg transition-colors cursor-pointer group"
                    >
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
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.email}
                          </span>
                        )}
                      </div>
                      {user.role && (
                        <Badge
                          variant="secondary"
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity
                          bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
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
