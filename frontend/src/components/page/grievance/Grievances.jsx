import MainLayout from "@/components/layout/MainLayout";
import GeneralTable from "@/components/table/CustomTable";
import { useGetAllGrievancesQuery } from "@/services/api.service";
import { useState } from "react";

const Grievances = () => {
  const [filters, setFilters] = useState({});

  const { data, isLoading, isFetching, error } =
    useGetAllGrievancesQuery(filters);

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
      accessorKey: "reported_by",
      header: "Reported By",
      sortable: true,
    },
  ];

  const customFilters = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Resolved", value: "resolved" },
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
    <MainLayout
      title={"Grievances"}
      buttonTitle={"Add Grievance"}
      buttonLink={"/grievances/add"}
    >
      <GeneralTable
        data={data?.data?.grievances || []}
        tableTitle={"Grievances"}
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        customFilters={customFilters}
        searchOptions={searchOptions}
      />
    </MainLayout>
  );
};

export default Grievances;
