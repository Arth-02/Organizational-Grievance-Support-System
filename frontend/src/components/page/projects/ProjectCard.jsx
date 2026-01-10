import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Users } from "lucide-react";
import cn from "classnames";
import AvatarGroup from "@/components/ui/AvatarGroup";

const PROJECT_STATUS_CONFIG = {
  planned: { 
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400", 
    label: "Planned" 
  },
  active: { 
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", 
    label: "Active" 
  },
  on_hold: { 
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", 
    label: "On Hold" 
  },
  completed: { 
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", 
    label: "Completed" 
  },
  archived: { 
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400", 
    label: "Archived" 
  },
};

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const statusConfig = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.planned;

  // Combine members and managers for display
  const allMembers = [
    ...(project.managers || []).map((m) => ({ ...m, role: "Manager" })),
    ...(project.members || []).map((m) => ({ ...m, role: "Member" })),
  ];

  const memberCount = allMembers.length;

  const handleClick = () => {
    navigate(`/projects/${project._id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden cursor-pointer",
        "border border-border",
        "bg-card",
        "hover:border-primary/30 hover:shadow-lg",
        "transition-all duration-200"
      )}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Project Icon */}
            {project.icon ? (
              <img
                src={project.icon}
                alt={`${project.name} icon`}
                className="w-9 h-9 rounded-lg object-cover"
              />
            ) : (
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              {/* Project Name */}
              <h4 className="font-semibold text-base text-card-foreground leading-tight truncate">
                {project.name}
              </h4>
              {/* Project Key */}
              <span className="text-xs text-muted-foreground font-medium">
                {project.key}
              </span>
            </div>
          </div>
          {/* Status Badge */}
          <Badge
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wide shrink-0",
              statusConfig.badge
            )}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-2">
        {/* Description (if exists) */}
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        {/* Footer with member count */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
          </div>

          {/* Avatar Group */}
          {allMembers.length > 0 && (
            <div onClick={(e) => e.stopPropagation()}>
              <AvatarGroup
                users={allMembers}
                limit={3}
                avatarType="Members"
                size="small"
                shoudlShowFilters={true}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
