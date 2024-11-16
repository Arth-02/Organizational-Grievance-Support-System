import { CheckCircle } from "lucide-react";
import { ProjectCard, ProjectCardSkeleton } from "./ProjectCard";

const ProjectList = ({ projects, isLoading, skeletonCount = 2 }) => {

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 mx-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 my-4">
        {[...Array(skeletonCount)].map((_, index) => (
          <ProjectCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 mx-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 my-4">
      {projects.map((project) => (
        <ProjectCard key={project._id} project={project} />
      ))}
      {projects.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            No projects found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Create a new project to get started
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
