import { useState } from "react";
import GeneralTable from "@/components/table/CustomTable";
import MainLayout from "@/components/layout/MainLayout";
import { useNavigate } from "react-router-dom";
import ManagePermissions from "../../table/ManagePermissions";
import { useSelector } from "react-redux";
import { useDeleteRoleMutation, useGetAllRolesQuery } from "@/services/role.service";
import { useGetAllPermissionsQuery } from "@/services/user.service";

const Roles = () => {
  const [filters, setFilters] = useState({});

  const navigate = useNavigate();

  const userPermissions = useSelector((state) => state.user.permissions);

  const canCreate = userPermissions.includes("CREATE_ROLE");
  const canUpdate = userPermissions.includes("UPDATE_ROLE");
  const canDelete = userPermissions.includes("DELETE_ROLE");
  const canViewPermission = userPermissions.includes("VIEW_PERMISSION");

  const { data, isLoading, isFetching, error } = useGetAllRolesQuery(filters);
  const [deleteRole] = useDeleteRoleMutation();
  const { data: allPermissions } = useGetAllPermissionsQuery({
    skip: !canViewPermission,
  });

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      sortable: true,
    },
    ...(canViewPermission
      ? [
          {
            accessorKey: "permissions",
            header: "Permissions",
            sortable: false,
            cell: ({ row }) => (
              <ManagePermissions
                permissions={row.original.permissions}
                id={row.original._id}
                isEditable={true}
                edit="role"
              />
            ),
          },
        ]
      : []),
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
    navigate(`/roles/update/${id}`);
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
    ...(canViewPermission
      ? [{
          label: "Permissions",
          key: "permissions",
          options: [
            ...(allPermissions?.data?.map((permission) => ({
              label: permission.name,
              value: permission.slug,
            })) || []),
          ],
        }]
      : []),
  ];

  return (
    <MainLayout
      title={"Roles"}
      buttonTitle={canCreate ? "Add Role" : undefined}
      buttonLink={canCreate ? "/roles/add" : undefined}
    >
      <GeneralTable
        data={data?.data?.roles || []}
        tableTitle={"Roles"}
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
        searchOptions={searchOptions}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </MainLayout>
  );
};

export default Roles;
