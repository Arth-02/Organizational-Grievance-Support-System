import { useState } from "react";
import { User, Mail, IdCard } from "lucide-react";
import GeneralTable from "@/components/table/CustomTable";
import MainLayout from "@/components/layout/MainLayout";
import { useNavigate } from "react-router-dom";
import ManagePermissions from "../../table/ManagePermissions";
import { useSelector } from "react-redux";
import { useDeleteAllUsersMutation, useDeleteUserMutation, useGetAllPermissionsQuery, useGetAllUsersQuery } from "@/services/user.service";
import { useGetAllDepartmentNameQuery } from "@/services/department.service";
import { useGetAllRoleNameQuery } from "@/services/role.service";

const Employees = () => {
  const [filters, setFilters] = useState({
  });

  const { data, isLoading, isFetching, error } = useGetAllUsersQuery(filters);
  const [deleteAllUsers] = useDeleteAllUsersMutation();
  const [deleteUser] = useDeleteUserMutation();

  const userPermissions = useSelector((state) => state.user.permissions);

  const canCreate = userPermissions.includes("CREATE_USER");
  const canUpdate = userPermissions.includes("UPDATE_USER");
  const canDelete = userPermissions.includes("DELETE_USER");

  const canViewPermission = userPermissions.includes("VIEW_PERMISSION");
  const canViewRole = userPermissions.includes("VIEW_ROLE");
  const canViewDepartment = userPermissions.includes("VIEW_DEPARTMENT");

  const { data: allPermissions } = useGetAllPermissionsQuery(undefined, {
    skip: !canViewPermission,
  });
  const { data: departmentNames } = useGetAllDepartmentNameQuery(undefined, {
    skip: !canViewDepartment,
  });
  const { data: roleNames } = useGetAllRoleNameQuery(undefined, {
    skip: !canViewRole,
  });

  const navigate = useNavigate();

  const columns = [
    {
      accessorKey: "username",
      header: "Username",
      sortable: true,
      hideable: false,
    },
    { accessorKey: "email", header: "Email", sortable: true },
    { accessorKey: "firstname", header: "First Name", sortable: true },
    { accessorKey: "lastname", header: "Last Name", sortable: true },
    { accessorKey: "employee_id", header: "Employee ID", sortable: false },
    { accessorKey: "phone_number", header: "Phone", sortable: false },
    ...(canViewPermission
      ? [
          {
            accessorKey: "role_permissions",
            header: "Permissions",
            sortable: false,
            cell: ({ row }) => (
              <ManagePermissions
                permissions={row.original.role_permissions}
                removePermissions={row.original.special_permissions}
                edit="employee"
              />
            ),
          },
          {
            accessorKey: "special_permissions",
            header: "Special Permissions",
            sortable: false,
            cell: ({ row }) => (
              <ManagePermissions
                permissions={row.original.special_permissions}
                removePermissions={row.original.role_permissions}
                id={row.original._id}
                isEditable={true}
                edit="employee"
              />
            ),
          },
        ]
      : []),
    ...(canViewRole
      ? [{ accessorKey: "role", header: "Role", sortable: true }]
      : []),
    ...(canViewDepartment
      ? [{ accessorKey: "department", header: "Department", sortable: true }]
      : []),
    {
      accessorKey: "is_active",
      header: "Status",
      sortable: false,
      cell: ({ row }) => (row.original.is_active ? "Active" : "Inactive"),
    },
    {
      accessorKey: "last_login",
      header: "Last Login",
      sortable: true,
      cell: ({ row }) =>
        row.original.last_login
          ? new Date(row.original.last_login).toLocaleString()
          : "-",
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
    deleteUser(id);
  };

  const handleDeleteAll = (ids) => {
    if (ids.length > 0) {
      deleteAllUsers({ ids });
    }
  };

  const handleEdit = (id) => {
    navigate(`/employees/update/${id}`);
  };

  const searchOptions = [
    {
      label: "Username",
      example: "Arth",
      value: "username",
      icon: <User size={16} />,
    },
    {
      label: "Email",
      example: "arth@gmail.com",
      value: "email",
      icon: <Mail size={16} />,
    },
    {
      label: "Employee ID",
      example: "123456",
      value: "employee_id",
      icon: <IdCard size={16} />,
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
    ...(canViewDepartment
      ? [
          {
            label: "Department",
            key: "department",
            options: [
              { label: "All", value: "all" },
              ...(departmentNames?.data?.map((dept) => ({
                label: dept.name,
                value: dept._id,
              })) || []),
            ],
          },
        ]
      : []),
    ...(canViewRole
      ? [
          {
            label: "Role",
            key: "role",
            options: [
              { label: "All", value: "all" },
              ...(roleNames?.data?.map((role) => ({
                label: role.name,
                value: role._id,
              })) || []),
            ],
          },
        ]
      : []),

    ...(canViewPermission
      ? [
          {
            label: "Permissions",
            key: "permissions",
            options: [
              ...(allPermissions?.data?.map((permission) => ({
                label: permission.name,
                value: permission.slug,
              })) || []),
            ],
          },
        ]
      : []),
  ];

  return (
    <MainLayout
      title="Employees"
      buttonTitle={canCreate ? "Add New Employee" : undefined}
      buttonLink={canCreate ? "/employees/add" : undefined}
    >
      <GeneralTable
        data={data?.data?.users || []}
        tableTitle={"Employees"}
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        customFilters={customFilters}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        pagination={data?.data?.pagination}
        onDelete={handleDelete}
        onDeleteAll={handleDeleteAll}
        onEdit={handleEdit}
        searchOptions={searchOptions}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </MainLayout>
  );
};

export default Employees;
