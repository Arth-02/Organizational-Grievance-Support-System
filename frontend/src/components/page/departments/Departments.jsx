import { useState } from "react";
import GeneralTable from "@/components/table/CustomTable";
import MainLayout from "@/components/layout/MainLayout";
import { useSelector } from "react-redux";
import { useDeleteDepartmentMutation, useGetAllDepartmentsQuery } from "@/services/department.service";
import DepartmentDialog from "./DepartmentDialog";

const Departments = () => {
  const [filters, setFilters] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const { data, isLoading, isFetching, error, refetch } = useGetAllDepartmentsQuery(filters);
  const [deleteDepartment] = useDeleteDepartmentMutation();

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
    setEditId(id);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditId(null);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    refetch();
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
    <>
      <MainLayout
        title={"Departments"}
        buttonTitle={canCreate ? "Add Department" : undefined}
        onButtonClick={canCreate ? handleAdd : undefined}
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

      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editId={editId}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
};

export default Departments;
