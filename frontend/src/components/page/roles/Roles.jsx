import { useState } from "react";
// import { Check, ArrowUp, ArrowDown, EyeOff, ChevronsUpDown } from "lucide-react";
import GeneralTable from "@/components/table/CustomTable";
import MainLayout from "@/components/layout/MainLayout";
import {
  useGetAllRolesQuery,
  useDeleteRoleMutation,
  useGetAllRoleNameQuery,
  // useDeleteAllRolesMutation,
} from "@/services/api.service";
import { useNavigate } from "react-router-dom";
import ManagePermissions from "../employees/ManagePermissions";

const Roles = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    name: "",
    is_active: "",
    permissions: "",
    sort_by: "created_at",
    order: "desc",
  });

  const navigate = useNavigate();

  const { data, isLoading, isFetching, error } = useGetAllRolesQuery(filters);
  const [deleteRole] = useDeleteRoleMutation();
  const { data: roleNames } = useGetAllRoleNameQuery();
  // const [deleteAllRoles] = useDeleteAllRolesMutation();

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      sortable: true,
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      sortable: false,
      cell: ({ row }) => ( <ManagePermissions permissions={row.original.permissions} isEditable={true} /> ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      sortable: false,
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
    deleteRole(id);
  };

  // const handleDeleteAll = (ids) => {
  //   if (ids.length > 0) {
  //     deleteAllRoles({ ids });
  //   }
  // };

  const handleEdit = (id) => {
    navigate(`/roles/update/${id}`);// Add your navigation logic
  };

  const handleView = (id) => {
    console.log("View role:", id); // Add your view logic
  };

  const searchOptions = [
    {
      label: "Name",
      example: "Admin",
      value: "name",
    }
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
    {
      label: "Role",
      key: "name",
      options: [
        { label: "All", value: "all" },
        ...(roleNames?.data?.map((role) => ({ label: role.name, value: role.name })) ||
          []),
      ],
    },
  ];

  return (
    <MainLayout
      title={"Roles"}
      buttonTitle={"Add New Role"}
      buttonLink={"/roles/add"}
    >
      <GeneralTable
        data={data?.data?.roles || []}
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        customFilters={customFilters}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        pagination={data?.data?.pagination}
        onDelete={handleDelete}
        // onDeleteAll={handleDeleteAll}
        onEdit={handleEdit}
        onView={handleView}
        searchOptions={searchOptions}
      />
    </MainLayout>
  );
};

export default Roles;
