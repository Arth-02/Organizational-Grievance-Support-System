import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GeneralTable from "@/components/table/CustomTable";
import {
  useGetAllDepartmentsQuery,
  useDeleteDepartmentMutation,
} from "@/services/api.service";
import MainLayout from "@/components/layout/MainLayout";
import { useSelector } from "react-redux";

const Departments = () => {
  const [filters, setFilters] = useState({});

  const { data, isLoading, isFetching, error } = useGetAllDepartmentsQuery(filters);
  const [deleteDepartment] = useDeleteDepartmentMutation();

  const navigate = useNavigate();

  const userPermissions = useSelector(
    (state) => state.user.permissions
  );

  const canCreate = userPermissions.includes("CREATE_DEPARTMENT");
  const canUpdate = userPermissions.includes("UPDATE_DEPARTMENT");
  const canDelete = userPermissions.includes("DELETE_DEPARTMENT");

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
    },
  ];

  return (
    <MainLayout
      title={"Departments"}
      buttonTitle={canCreate ? "Add Department" : undefined}
      buttonLink={canCreate ? "/departments/add" : undefined}
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
        searchOptions={searchOptions}
        customFilters={customFilters}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </MainLayout>
  );
};

export default Departments;
