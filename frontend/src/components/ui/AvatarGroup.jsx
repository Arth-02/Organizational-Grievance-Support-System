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

const AvatarGroup = ({ users, limit = 3, avatarType }) => {
  const visibleUsers = users.slice(0, limit);
  const remainingCount = users.length - limit;

  return (
    <TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex relative -space-x-4 cursor-pointer">
            {visibleUsers.map((user, index) => (
              <Tooltip key={user._id}>
                <TooltipTrigger>
                  <Avatar
                    className="h-10 w-10 border-2 border-white dark:border-gray-800 bg-white dark:bg-gray-800 transition-transform duration-200"
                    style={{
                      zIndex: visibleUsers.length - index,
                      transform: "scale(1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.zIndex = 1000;
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.zIndex =
                        visibleUsers.length - index;
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                      {user.username.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.username}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {remainingCount > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Avatar
                    className="h-10 w-10 border border-white dark:border-gray-800 bg-white dark:bg-gray-800 transition-transform duration-200"
                    style={{ zIndex: 0, transform: "scale(1)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.zIndex = 1000;
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.zIndex = 0;
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                      +{remainingCount}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>+{remainingCount} more</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="min-w-36 p-4 px-2 bg-white dark:bg-slate-900 rounded-lg shadow-lg">
          <div className="flex flex-col gap-3">
            <h4 className="font-medium leading-none mb-2 px-4">
              All {avatarType}
            </h4>
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100/80 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                      {user.username.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                      {user.username}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

export default AvatarGroup;
