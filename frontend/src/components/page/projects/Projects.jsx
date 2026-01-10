import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Plus, Search, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllProjectsQuery } from "@/services/project.service";
import ProjectCard from "./ProjectCard";

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const userPermissions = useSelector((state) => state.user.permissions);
  const canCreate = userPermissions.includes("CREATE_PROJECT");

  const { data, isLoading, error } = useGetAllProjectsQuery();

  // Check if it's a "no projects found" response (could come as error or data)
  const isNoProjectsResponse = 
    (data?.success === 0 && data?.message === "No projects found") ||
    (error?.data?.success === 0 && error?.data?.message === "No projects found");

  // Filter projects based on search query (name or key)
  const filteredProjects = useMemo(() => {
    const projects = data?.data?.projects || [];
    if (!searchQuery.trim()) return projects;
    
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.name?.toLowerCase().includes(query) ||
        project.key?.toLowerCase().includes(query)
    );
  }, [data?.data?.projects, searchQuery]);

  const handleAddProject = () => {
    navigate("/projects/add", { state: { background: location } });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center pb-4 shrink-0">
          <h1 className="text-xl font-semibold text-foreground">Projects</h1>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-64" />
            {canCreate && <Skeleton className="h-9 w-32" />}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state (but not for "no projects found" which is a valid empty state)
  if (error && !isNoProjectsResponse) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <p className="text-destructive">Failed to load projects. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Projects</h1>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          {/* Add Project Button (permission-gated) */}
          {canCreate && (
            <Button size="sm" onClick={handleAddProject}>
              <Plus size={18} className="mr-2" />
              Add Project
            </Button>
          )}
        </div>
      </div>

      {/* Project Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <FolderKanban className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            {searchQuery ? "No projects found" : "No projects yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery
              ? "Try adjusting your search query"
              : "Get started by creating your first project"}
          </p>
          {!searchQuery && canCreate && (
            <Button onClick={handleAddProject}>
              <Plus size={18} className="mr-2" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
