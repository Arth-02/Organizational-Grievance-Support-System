import { useState } from 'react';
import { User, Mail, IdCard, Edit3, Trash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GeneralTable from '@/components/table/CustomTable';
import {
  useDeleteAllUsersMutation,
  useDeleteUserMutation,
  useGetAllDepartmentNameQuery,
  useGetAllRoleNameQuery,
  useGetAllUsersQuery,
} from "@/services/api.service";

const Employees = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    username: "",
    email: "",
    is_active: "",
    employee_id: "",
    role: "",
    department: "",
    sort_by: "created_at",
    order: "desc",
  });

  const { data, isLoading, isFetching, error } = useGetAllUsersQuery(filters);
  const [deleteAllUsers] = useDeleteAllUsersMutation();
  const { data: departmentNames } = useGetAllDepartmentNameQuery();
  const { data: roleNames } = useGetAllRoleNameQuery();
  const [deleteUser] = useDeleteUserMutation();

  const columns = [
    { accessorKey: "username", header: "Username", sortable: true, hideable: false },
    { accessorKey: "email", header: "Email", sortable: true, },
    { accessorKey: "firstname", header: "First Name", sortable: true },
    { accessorKey: "lastname", header: "Last Name", sortable: true },
    { accessorKey: "employee_id", header: "Employee ID", sortable: false },
    { accessorKey: "role", header: "Role", sortable: true },
    { accessorKey: "department", header: "Department", sortable: true },
    {
      accessorKey: "is_active",
      header: "Status",
      sortable: false,
      cell: ({ row }) => (row.is_active ? "Active" : "Inactive"),
    },
    {
      accessorKey: "last_login",
      header: "Last Login",
      sortable: false,
      cell: ({ row }) => row.last_login ? new Date(row.last_login).toLocaleString() : "-",
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      sortable: true,
      cell: ({ row }) => row.created_at ? new Date(row.created_at).toLocaleString() : "-",
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
    // Implement edit functionality
    console.log('Edit user:', id);
  };

  const handleView = (id) => {
    // Implement view functionality
    console.log('View user:', id);
  };

  const searchOptions = [
    { label: "Username", example: "Arth", value: "username", icon: <User size={16} /> },
    { label: "Email", example: "arth@gmail.com", value: "email", icon: <Mail size={16} /> },
    { label: "Employee ID", example: "123456", value: "employee_id", icon: <IdCard size={16} /> },
  ];

  const customFilters = [
    {
      label: "Department",
      key: "department",
      options: [
        { label: "All", value: "all" },
        ...(departmentNames?.map(dept => ({ label: dept.name, value: dept._id })) || []),
      ],
    },
    {
      label: "Role",
      key: "role",
      options: [
        { label: "All", value: "all" },
        ...(roleNames?.map(role => ({ label: role.name, value: role._id })) || []),
      ],
    },
  ];

  return (
    <GeneralTable
      data={data?.users || []}
      columns={columns}
      filters={filters}
      setFilters={setFilters}
      customFilters={customFilters}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      pagination={data?.pagination}
      onDelete={handleDelete}
      onDeleteAll={handleDeleteAll}
      onEdit={handleEdit}
      searchOptions={searchOptions}
      actions={({ row }) => (
        <>
          <Button
            variant="ghost"
            onClick={() => handleEdit(row._id)}
            size="sm"
            className="p-2 bg-orange-100/50 text-orange-500 hover:bg-orange-100/80 hover:text-orange-700"
          >
            <Edit3 size={15} />
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleDelete(row._id)}
            size="sm"
            className="p-2 bg-red-100/50 text-red-500 hover:bg-red-100/80 hover:text-red-700"
          >
            <Trash size={15} />
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleView(row._id)}
            size="sm"
            className="p-2 bg-blue-100/50 text-blue-500 hover:bg-blue-100/80 hover:text-blue-700"
          >
            <Eye size={15} />
          </Button>
        </>
      )}
    />
  );
};

export default Employees;