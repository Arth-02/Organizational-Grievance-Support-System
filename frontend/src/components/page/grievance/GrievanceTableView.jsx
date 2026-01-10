import { useEffect, useState, useMemo } from "react";
import GeneralTable from "@/components/table/CustomTable";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useDeleteGrievanceByIdMutation, useGetAllGrievancesQuery } from "@/services/grievance.service";
import DOMPurify from "dompurify";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Calendar } from "lucide-react";

const STATUS_BADGES = {
  submitted: { 
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", 
    label: "Submitted" 
  },
  "in-progress": {
    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    label: "In Progress",
  },
  resolved: { 
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", 
    label: "Resolved" 
  },
  dismissed: { 
    color: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400", 
    label: "Dismissed" 
  },
};

const PRIORITY_BADGES = {
  low: { 
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", 
    label: "Low" 
  },
  medium: { 
    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", 
    label: "Medium" 
  },
  high: { 
    color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400", 
    label: "High" 
  },
};

const GrievanceTableView = ({ myFilter }) => {
  const [filters, setFilters] = useState({});
  
  // Compute query filters including the myFilter from parent
  const queryFilters = useMemo(() => {
    const baseFilters = { ...filters };
    if (myFilter && myFilter !== "all") {
      baseFilters.my_filter = myFilter;
    }
    return baseFilters;
  }, [filters, myFilter]);
  
  const { data, isLoading, isFetching, error } = useGetAllGrievancesQuery(queryFilters);
  const [deleteGrievance] = useDeleteGrievanceByIdMutation();
  const [localGrievances, setLocalGrievances] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (data?.data?.grievances) {
      setLocalGrievances(data.data.grievances);
    }
  }, [data]);

  // Handle optimistic updates from modal
  useEffect(() => {
    const handleOptimisticUpdate = (event) => {
      const { grievanceId, updatedData } = event.detail;
      setLocalGrievances((prev) =>
        prev.map((g) => (g._id === grievanceId ? { ...g, ...updatedData } : g))
      );
    };

    window.addEventListener("grievance_optimistic_update", handleOptimisticUpdate);
    return () => {
      window.removeEventListener("grievance_optimistic_update", handleOptimisticUpdate);
    };
  }, []);

  const handleViewDetails = (id) => {
    navigate(`/grievances/${id}`, { state: { background: location } });
  };

  const columns = [
    {
      accessorKey: "title",
      header: "Grievance",
      sortable: true,
      cell: ({ row }) => (
        <div 
          className="max-w-[280px] cursor-pointer group"
          onClick={() => handleViewDetails(row.original._id)}
        >
          <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {row.original.title}
          </p>
          <div
            className="text-xs text-muted-foreground line-clamp-1 mt-0.5"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(row.original.description?.replace(/<[^>]*>/g, '') || ''),
            }}
          />
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      sortable: true,
      cell: ({ row }) => {
        const status = row.original.status;
        const badge = STATUS_BADGES[status];
        return (
          <Badge className={`${badge?.color} text-xs font-medium px-2 py-0.5`}>
            {badge?.label || status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      sortable: true,
      cell: ({ row }) => {
        const priority = row.original.priority;
        const badge = PRIORITY_BADGES[priority];
        return (
          <Badge className={`${badge?.color} text-xs font-medium px-2 py-0.5`}>
            {badge?.label || priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "reported_by",
      header: "Reported By",
      sortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={row.original.reported_by?.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {row.original.reported_by?.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground">{row.original.reported_by?.username || "N/A"}</span>
        </div>
      ),
    },
    {
      accessorKey: "assigned_to",
      header: "Assigned To",
      sortable: true,
      cell: ({ row }) => (
        row.original.assigned_to ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={row.original.assigned_to?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {row.original.assigned_to?.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{row.original.assigned_to?.username}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        )
      ),
    },
    {
      accessorKey: "department_id.name",
      header: "Department",
      sortable: true,
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {row.original.department_id?.name || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "date_reported",
      header: "Reported",
      sortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(row.original.date_reported).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: "attachments",
      header: "Files",
      sortable: false,
      cell: ({ row }) => {
        const count = row.original.attachments?.length || 0;
        return count > 0 ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" />
            {count}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
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
      example: "Grievance Title",
      value: "title",
    },
    {
      label: "Description",
      example: "Grievance Description",
      value: "description",
    },
    {
      label: "Reported By",
      example: "Employee Name",
      value: "reported_by",
    },
  ];

  const handleCloseGrievance = async (id) => {
    try {
      const response = await deleteGrievance(id).unwrap();
      toast.success(response.data.message);
    } catch (error) {
      console.error("Failed to close grievance:", error);
      toast.error(error.data.message);
    }
  };

  const handleEdit = (id) => {
    navigate(`/grievances/${id}`, { state: { background: location } });
  };

  return (
    <GeneralTable
      data={localGrievances || []}
      tableTitle={"Grievances"}
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
      onDelete={handleCloseGrievance}
      onEdit={handleEdit}
    />
  );
};

export default GrievanceTableView;
