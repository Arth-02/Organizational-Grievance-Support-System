import MainLayout from "@/components/layout/MainLayout"
import { useGetAllProjectsQuery } from "@/services/project.service"
import { useSelector } from "react-redux";
import ProjectList from "./ProjectList";
import { Separator } from "@/components/ui/separator";

const AllProjects = () => {

  const { data: projectsData, isLoading: projectsLoading } = useGetAllProjectsQuery();

  const user = useSelector((state) => state.user);

  // filter projects into my projects and other projects
  const myProjects = projectsData?.data?.projects?.filter((project) => project.manager.includes(user.id));
  const otherProjects = projectsData?.data?.projects?.filter((project) => !project.manager.includes(user.id));
  

  return (
    <MainLayout title={"All Projects"}>
      <div className="space-y-6">
        <section>
          <h1 className="text-lg text-gray-800 dark:text-white">My Projects</h1>
          <ProjectList projects={myProjects} isLoading={projectsLoading} skeletonCount={1} />
        </section>

        <Separator className="dark:bg-white/60 my-6" />

        <section>
          <h1 className="text-lg text-gray-800 dark:text-white">Other Projects</h1>
          <ProjectList projects={otherProjects} isLoading={projectsLoading} skeletonCount={2} />
        </section>
      </div>
    </MainLayout>
  )
}

export default AllProjects