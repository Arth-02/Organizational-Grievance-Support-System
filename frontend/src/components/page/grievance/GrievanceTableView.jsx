// GrievanceTableView.js
import { useEffect, useState } from "react";
import { useGetAllGrievancesQuery } from "@/services/api.service";
import GeneralTable from "@/components/table/CustomTable";
import StatusTag from "@/components/table/StatusTag";

const GrievanceTableView = () => {
  const [filters, setFilters] = useState({});
  const { data, isLoading, isFetching, error } = useGetAllGrievancesQuery(filters);
  const [localGrievances, setLocalGrievances] = useState([]);

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
    />
  );
};

export default GrievanceTableView;
