import AvatarGroup from "@/components/ui/AvatarGroup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteProjectMutation } from "@/services/project.service";
import {
  Calendar,
  Users,
  Clock,
  EllipsisVertical,
  Edit2,
  ExternalLink,
  Trash,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [deleteProject] = useDeleteProjectMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEdit = () => {
    navigate(`/projects/${project._id}/edit`);
  };

  const handleGoToProject = () => {
    navigate(`/projects/${project._id}/board/${project.board_id}`);
  };

  const handleDelete = () => {
    setIsModalOpen(true); // Show the modal
  };

  const confirmDelete = () => {
    deleteProject(project._id); // Perform the delete action
    setIsModalOpen(false); // Close the modal after deletion
  };

  const formattedUserList = project.members?.map((user) => {
    return {
      _id: user._id,
      avatar: user.avatar,
      email: user.email,
      username: user.username,
      role: project.manager.includes(user._id) ? "Manager" : "Member",
    }
  });

  return (
    <div className="flex flex-col h-full p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
      {/* Project Status Badge */}
      <div className="flex justify-between items-start mb-2">
        <Link
          to={`/projects/${project._id}/board/${project.board_id}`}
          className="text-xl font-semibold text-gray-900 dark:text-gray-200 line-clamp-1 hover:underline"
        >
          {project.name}
        </Link>

        {/* Dropdown for edit, go to project and delete project options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="relative left-2 -top-1">
            <EllipsisVertical className="w-[30px] h-7 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 dark:focus:bg-white/10 cursor-pointer p-1 rounded-md transition-all" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white dark:bg-slate-900">
            <DropdownMenuItem
              className="hover:bg-gray-100 dark:hover:bg-slate-600/50 cursor-pointer"
              onClick={handleEdit}
            >
              <Edit2 className="w-4 h-4 mr-3" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-gray-100 dark:hover:bg-slate-600/50 cursor-pointer"
              onClick={handleGoToProject}
            >
              <ExternalLink className="w-4 h-4 mr-3" />
              Go to Project
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 hover:text-red-600 hover:bg-red-200/40 dark:text-red-400 dark:hover:bg-red-500/20 cursor-pointer focus:bg-red-200/40 focus:text-red-600"
              onClick={handleDelete}
            >
              <Trash className="w-4 h-4 mr-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <div className="absolute -bottom-1 -right-2">
          <AvatarGroup users={formattedUserList} limit={2} avatarType={"Members"} />
        </div>
      </div>

      {/* Modal for confirming deletion */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Confirm Deletion"
        description="Are you sure you want to delete this project? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText="Delete"
        confirmVariant="destructive"
      >
        <p>This will permanently delete the project and all related data.</p>
      </Modal>
    </div>
  );
};

export { ProjectCard, ProjectCardSkeleton };
