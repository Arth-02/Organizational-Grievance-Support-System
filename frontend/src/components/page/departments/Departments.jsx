import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GeneralTable from "@/components/table/CustomTable"; // Assuming GeneralTable is reusable
import {
  useGetAllDepartmentsQuery,
  useDeleteDepartmentMutation,
} from "@/services/api.service";
import MainLayout from "@/components/layout/MainLayout";

const Departments = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    name: "",
    is_active: "",
    sort_by: "created_at",
    order: "desc",
  });

  const { data, isLoading, isFetching, error } =
    useGetAllDepartmentsQuery(filters);
  const [deleteDepartment] = useDeleteDepartmentMutation();

  const navigate = useNavigate();

  const columns = [
    { accessorKey: "name", header: "Name", sortable: true },
    { accessorKey: "description", header: "Description", sortable: true },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (row.original.is_active ? "Active" : "Inactive"),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      sortable: true,
      cell: ({ row }) =>
        row.original.created_at
          ? new Date(row.original.created_at).toLocaleString()
          : "-",
    },
  ];

  const handleDelete = (id) => {
    deleteDepartment(id);
  };

  const handleEdit = (id) => {
    navigate(`/departments/update/${id}`);
  };

  const handleView = (id) => {
    console.log("View department:", id);
  };

  const searchOptions = [
    {
      label: "Name",
      example: "Admin",
      value: "name",
    },
  ];

  const customFilters = [
    {
      label: "Status",
      key: "is_active",
      options: [
        { label: "All", value: "all" },
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    }
  ];

  return (
    <MainLayout
      title={"Departments"}
      buttonTitle={"Add New Department"}
      buttonLink={"/departments/add"}
    >
      <GeneralTable
        data={data?.data?.departments || []}
        tableTitle={"Departments"}
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        pagination={data?.data?.pagination}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onView={handleView}
        searchOptions={searchOptions}
        customFilters={customFilters}
      />
    </MainLayout>
  );
};

export default Departments;
