import AvatarGroup from "@/components/ui/AvatarGroup";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const ProjectCardSkeleton = () => {
  return (
    <div className="flex flex-col h-full p-5 relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header with title and status */}
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        {/* <Skeleton className="h-4 w-full" /> */}
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Project Details */}
      <div className="mt-auto space-y-3">
        {/* Date Information */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Team Size */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Bottom row with date and avatars */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Avatar group for managers of project */}
        <div className="absolute bottom-2 right-2 flex -space-x-4">
          <Skeleton className="h-10 w-10 border border-white dark:border-gray-800 bg-white dark:bg-gray-700 rounded-full z-50" />
          <Skeleton className="h-10 w-10 border border-white dark:border-gray-800 bg-white dark:bg-gray-700 rounded-full z-40" />
          <Skeleton className="h-10 w-10 border border-white dark:border-gray-800 bg-white dark:bg-gray-700 rounded-full z-30" />
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({ project }) => {
  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:text-green-500 dark:bg-green-500/20"
      : "bg-red-100 text-red-800";
  };

  return (
    <div className="flex flex-col h-full p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
      {/* Project Status Badge */}
      <div className="flex justify-between items-start mb-2">
        <Link to={`/projects/${project._id}/board/${project.board_id}`} className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-1 hover:underline">
          {project.name}
        </Link>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
            project.is_active
          )}`}
        >
          {project.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Project Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {project.description}
      </p>

      {/* Project Details */}
      <div className="mt-auto space-y-2 relative">
        {/* Date Information */}
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">
            {formatDate(project.start_date)} - {formatDate(project.end_date)}
          </span>
        </div>

        {/* Team Size */}
        <div className="flex items-center space-x-2 text-sm">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">
            {project.members?.length || 0} team members
          </span>
        </div>

        {/* Bottom row with date and avatars */}
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">
            Created at {formatDate(project.created_at)}
          </span>
        </div>

        {/* Avatar group for managers of project */}
        <div className="absolute -bottom-2 -right-2">
          <AvatarGroup users={project.manager} limit={2} />
        </div>
      </div>
    </div>
  );
};

export { ProjectCard, ProjectCardSkeleton };
