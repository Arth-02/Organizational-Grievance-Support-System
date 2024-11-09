// GrievanceTableView.js
import { useEffect, useState } from "react";
import GeneralTable from "@/components/table/CustomTable";
import StatusTag from "@/components/table/StatusTag";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetAllGrievancesQuery, useUpdateGrievanceMutation } from "@/services/grievance.service";

const GrievanceTableView = () => {
  const [filters, setFilters] = useState({});
  const { data, isLoading, isFetching, error } = useGetAllGrievancesQuery(filters);
  const [updateGrievance] = useUpdateGrievanceMutation();
  
  const [localGrievances, setLocalGrievances] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (data?.data?.grievances) {
      setLocalGrievances(data.data.grievances);
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
    },
    {
      accessorKey: "status",
      header: "Status",
      sortable: true,
    },
    {
      accessorKey: "date_reported",
      header: "Reported Date",
      sortable: true,
      cell: ({ row }) => new Date(row.original.date_reported).toDateString(),
    },
    {
      accessorKey: "reported_by.username",
      header: "Reported By",
      sortable: true,
    },
    {
      accessorKey: "assigned_to.username",
      header: "Assigned To",
      sortable: true,
    },
    {
      accessorKey: "department_id.name",
      header: "Department",
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
      const response = await updateGrievance({
        id: id,
        data: { is_active: false },
      }).unwrap();
      toast.success(response.message);
    } catch (error) {
      console.error("Failed to close grievance:", error);
      toast.error("Failed to close grievance");
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
