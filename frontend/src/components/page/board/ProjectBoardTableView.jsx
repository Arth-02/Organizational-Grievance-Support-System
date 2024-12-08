import { useEffect, useState } from "react";
import GeneralTable from "@/components/table/CustomTable";
import StatusTag from "@/components/table/StatusTag";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { useDeleteProjectBoardTaskMutation, useGetProjectBoardTasksQuery } from "@/services/project.service";

const ProjectTableView = () => {
  const [filters, setFilters] = useState({});

  const { projectId } = useParams();

  const { data, isLoading, isFetching, error } = useGetProjectBoardTasksQuery(projectId);
  const [deleteProjectTask] = useDeleteProjectBoardTaskMutation();
  const [localTasks, setLocalTasks] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (data?.data?.tasks) {
      setLocalTasks(data.data.tasks);
    }
  }, [data]);

  const columns = [
    {
      accessorKey: "title",
      header: "Title",
      sortable: true,
    },
    {
      accessorKey: "description",
      header: "Description",
      sortable: true,
      cell: ({ row }) => {
        return (
          <div
            className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(row.original.description),
            }}
          />
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      sortable: true,
    },
    {
      accessorKey: "date_created",
      header: "Created Date",
      sortable: true,
      cell: ({ row }) => new Date(row.original.date_created).toDateString(),
    },
    {
      accessorKey: "assigned_to.username",
      header: "Assigned To",
      sortable: true,
    },
    {
      accessorKey: "priority",
      header: "Priority",
      sortable: true,
      cell: ({ row }) => {
        if (row.original.priority === "low") {
          return (
            <StatusTag
              value={row.original.priority}
              classNames={
                "bg-green-100 dark:bg-green-100/20 text-green-600 dark:text-green-400"
              }
            />
          );
        } else if (row.original.priority === "medium") {
          return (
            <StatusTag
              value={row.original.priority}
              classNames={
                "bg-orange-100 dark:bg-orange-100/20 text-orange-600 dark:text-orange-400"
              }
            />
          );
        } else {
          return (
            <StatusTag
              value={row.original.priority}
              classNames={
                "bg-red-100 dark:bg-red-100/20 text-red-600 dark:text-red-600"
              }
            />
          );
        }
      },
    },
    {
      accessorKey: "attachments",
      header: "Attachments",
      sortable: true,
      cell: ({ row }) => row.original.attachments.length,
    }
  ];

  const customFilters = [
    {
      key: "status",
      label: "Status",
      placeholder: "All",
      options: [
        { label: "All", value: "all" },
        { label: "Submitted", value: "submitted" },
        { label: "In Progress", value: "in-progress" },
        { label: "Resolved", value: "resolved" },
        { label: "Dismissed", value: "dismissed" },
      ],
    },
  ];

  const searchOptions = [
    {
      label: "Title",
      example: "Task Title",
      value: "title",
    },
    {
      label: "Description",
      example: "Task Description",
      value: "description",
    },
    {
      label: "Assigned To",
      example: "Employee Name",
      value: "assigned_to",
    },
  ];

  const handleCloseTask = async (id) => {
    try {
      const response = await deleteProjectTask(id).unwrap();
      toast.success(response.data.message);
    } catch (error) {
      console.error("Failed to close task:", error);
      toast.error(error.data.message);
    }
  };

  const handleEdit = (id) => {
    navigate(`/projects/tasks/${id}`, { state: { background: location } });
  };

  return (
    <GeneralTable
      data={localTasks || []}
      tableTitle={"Project Tasks"}
      columns={columns}
      filters={filters}
      setFilters={setFilters}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      customFilters={customFilters}
      searchOptions={searchOptions}
      pagination={data?.data?.pagination}
      canUpdate={true}
      canDelete={true}
      onDelete={handleCloseTask}
      onEdit={handleEdit}
    />
  );
};

export default ProjectTableView;
