import MainLayout from "@/components/layout/MainLayout";
import GeneralTable from "@/components/table/CustomTable";
import StatusTag from "@/components/table/StatusTag";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetAllGrievancesQuery,
  useUpdateGrievanceMutation,
} from "@/services/api.service";
import { useEffect, useState } from "react";
import GrievanceBoardView from "./GrievanceBoardView";
import toast from "react-hot-toast";
import useSocket from "@/utils/useSocket";

const Grievances = () => {
  const [filters, setFilters] = useState({});
  const [activeView, setActiveView] = useState("board");
  const [localGrievances, setLocalGrievances] = useState([]);

  const { data, isLoading, isFetching, error } =
    useGetAllGrievancesQuery(filters);
  const [updateGrievance] = useUpdateGrievanceMutation();

  const socket = useSocket();

  useEffect(() => {
    socket.on("update_grievance", (msg) => {
      console.log("Notification received:", msg);
      setLocalGrievances([...msg.updatedData]);
    });
  }, [socket]);

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

  const handleDragEnd = async (grievanceId, newStatus) => {
    try {
      // Update local state immediately for a responsive UI
      setLocalGrievances((prevGrievances) =>
        prevGrievances.map((grievance) =>
          grievance._id.toString() === grievanceId
            ? { ...grievance, status: newStatus }
            : grievance
        )
      );

      const data = {
        status: newStatus,
      };

      // Call the API to update the grievance status
      const test = await updateGrievance({ id: grievanceId, data });

      if (test.error) {
        throw new Error(test.error.data.message);
      }

      // Optionally, you can refetch the data here if needed
      // refetch();
    } catch (error) {
      console.log("Error updating grievance status:", error.message);
      toast.error(error.message);
      // Revert the local state if the API call fails
      setLocalGrievances(data?.data?.grievances || []);
    }
  };

  return (
    <MainLayout
      title={"Grievances"}
      buttonTitle={"Add Grievance"}
      buttonLink={"/grievances/add"}
    >
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="board">Board View</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
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
        </TabsContent>
        <TabsContent value="board">
          <GrievanceBoardView
            grievances={localGrievances || []}
            onDragEnd={handleDragEnd}
          />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Grievances;
