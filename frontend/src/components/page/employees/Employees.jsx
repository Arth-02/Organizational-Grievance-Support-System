import { useState } from "react";
import { User, Mail, IdCard } from "lucide-react";
import GeneralTable from "@/components/table/CustomTable";
import {
  useDeleteAllUsersMutation,
  useDeleteUserMutation,
  useGetAllDepartmentNameQuery,
  useGetAllPermissionsQuery,
  useGetAllRoleNameQuery,
  useGetAllUsersQuery,
} from "@/services/api.service";
import MainLayout from "@/components/layout/MainLayout";
import { useNavigate } from "react-router-dom";
import ManagePermissions from "./ManagePermissions";

const Employees = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    username: "",
    email: "",
    is_active: "",
    employee_id: "",
    role: "all",
    department: "all",
    sort_by: "created_at",
    order: "desc",
  });

  const { data, isLoading, isFetching, error } = useGetAllUsersQuery(filters);
  const [deleteAllUsers] = useDeleteAllUsersMutation();
  const { data: departmentNames } = useGetAllDepartmentNameQuery();
  const { data: roleNames } = useGetAllRoleNameQuery();
  const { data: allPermissions } = useGetAllPermissionsQuery();
  const [deleteUser] = useDeleteUserMutation();

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
    { accessorKey: "role", header: "Role", sortable: true },
    { accessorKey: "department", header: "Department", sortable: true },
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

  const handleView = (id) => {
    // Implement view functionality
    console.log("View user:", id);
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
  ];

  return (
    <MainLayout
      title={"Employees"}
      buttonTitle={"Add New Employee"}
      buttonLink={"/employees/add"}
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
        onView={handleView}
        searchOptions={searchOptions}
      />
    </MainLayout>
  );
};

export default Employees;
