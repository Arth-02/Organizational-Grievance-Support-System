import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AvatarGroup = ({ users, limit = 3 }) => {
  const visibleUsers = users.slice(0, limit);
  const remainingCount = users.length - limit;

  return (
    <TooltipProvider>
      <div className="flex relative -space-x-4">
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
                  e.currentTarget.style.zIndex = visibleUsers.length - index;
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
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
              {/* <p>{users.slice(limit).map(user => user.username).join(', ')}</p> */}
              <p>+{remainingCount} more</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AvatarGroup;
