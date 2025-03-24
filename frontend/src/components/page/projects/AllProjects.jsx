import MainLayout from "@/components/layout/MainLayout";
import { useGetAllProjectsQuery } from "@/services/project.service";
import { useSelector } from "react-redux";
import ProjectList from "./ProjectList";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";

const AllProjects = () => {
  const { data: projectsData, isLoading: projectsLoading } =
    useGetAllProjectsQuery();

  const { user } = useSelector((state) => state.user);
  const userPermissions = useSelector((state) => state.user.permissions);

  const canSeeAllProjects = userPermissions.includes("VIEW_PROJECT");
  const canCreateProject = userPermissions.includes("CREATE_PROJECT");

  // filter projects into my projects and other projects
  const myProjects = projectsData?.data?.projects?.filter((project) =>
    project.members.includes(user?._id?.toString())
  );
  const otherProjects = projectsData?.data?.projects?.filter(
    (project) => !project.members.includes(user?._id?.toString())
  );

  const shouldShowMyProjects = myProjects && myProjects.length > 0;
  const shouldShowOtherProjects =
    otherProjects && otherProjects.length > 0 && canSeeAllProjects;
  const shouldShowNoProjects =
    !shouldShowMyProjects && !shouldShowOtherProjects;
  const shouldShowSeparator = shouldShowMyProjects && shouldShowOtherProjects;

  return (
    <MainLayout
      title={"All Projects"}
      buttonLink={canCreateProject ? "/projects/add" : undefined}
      buttonTitle={canCreateProject ? "Create New Project" : undefined}
    >
      <div className="space-y-6">
        {(shouldShowMyProjects || projectsLoading) && (
          <section>
            <h1 className="text-lg text-gray-800 dark:text-gray-200">
              My Projects
            </h1>
            <ProjectList
              projects={myProjects}
              isLoading={projectsLoading}
              skeletonCount={2}
            />
          </section>
        )}

        {(shouldShowSeparator || projectsLoading) && (
          <Separator className="dark:bg-white/20 my-6" />
        )}

        {(shouldShowOtherProjects || projectsLoading) && (
          <section>
            <h1 className="text-lg text-gray-800 dark:text-gray-200">
              Other Projects (Not a member)
            </h1>
            <ProjectList
              projects={otherProjects}
              isLoading={projectsLoading}
              skeletonCount={3}
            />
          </section>
        )}

        {(shouldShowNoProjects || projectsLoading) && (
          <div className="col-span-full min-h-[calc(100vh-170px)] flex flex-col items-center justify-center p-8 text-center">
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
    </MainLayout>
  );
};

export default AllProjects;
