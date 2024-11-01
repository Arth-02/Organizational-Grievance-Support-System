/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { DragDropContext } from "@hello-pangea/dnd";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGetAllGrievancesQuery, useUpdateGrievanceMutation } from "@/services/api.service";
import GrievanceList from "./GrievanceList";
import toast from "react-hot-toast";
import useSocket from "@/utils/useSocket";

const GrievanceBoardView = () => {
  const lists = ["submitted", "in-progress", "resolved", "dismissed"];
  const location = useLocation();

  const [updateGrievance] = useUpdateGrievanceMutation();

  const socket = useSocket();

  const [filters, setFilters] = useState({});
  const [localGrievances, setLocalGrievances] = useState([]);

  const [page, setPage] = useState({
    submitted: 1,
    "in-progress": 1,
    resolved: 1,
    dismissed: 1,
  });
  const [grievances, setGrievances] = useState({
    submitted: [],
    "in-progress": [],
    resolved: [],
    dismissed: [],
  });
  const [hasNextPage, setHasNextPage] = useState({
    submitted: false,
    "in-progress": false,
    resolved: false,
    dismissed: false,
  });
  const [isInitialized, setIsInitialized] = useState({
    submitted: false,
    "in-progress": false,
    resolved: false,
    dismissed: false,
  });

  const handlePageChange = (status, newPage) => {
    setPage((prev) => ({
      ...prev,
      [status]: newPage,
    }));
  };

  const { data: submittedGrievance } = useGetAllGrievancesQuery({
    ...filters,
    status: "submitted",
    page: page.submitted,
  });

  const { data: inProgressGrievance } = useGetAllGrievancesQuery({
    ...filters,
    status: "in-progress",
    page: page["in-progress"],
  });

  const { data: resolvedGrievance } = useGetAllGrievancesQuery({
    ...filters,
    status: "resolved",
    page: page.resolved,
  });

  const { data: dismissedGrievance } = useGetAllGrievancesQuery({
    ...filters,
    status: "dismissed",
    page: page.dismissed,
  });

  const updateGrievances = (status, newGrievances, hasNextPageStatus) => {
    if (!isInitialized[status] && page[status] === 1) {
      // Initial load
      setGrievances((prev) => ({
        ...prev,
        [status]: newGrievances,
      }));
      setIsInitialized((prev) => ({
        ...prev,
        [status]: true,
      }));
    } else if (page[status] > 1) {
      // Subsequent loads (pagination)
      setGrievances((prev) => ({
        ...prev,
        [status]: [...prev[status], ...newGrievances],
      }));
    }

    setHasNextPage((prev) => ({
      ...prev,
      [status]: hasNextPageStatus,
    }));
  };

  const onDragEnd = async (grievanceId, newStatus) => {
    let originalGrievances;
  
    try {
      // Save the original state of grievances before making any changes
      originalGrievances = { ...grievances };
  
      // Update the state optimistically for a responsive UI
      const updatedGrievances = { ...grievances };
      const oldStatus = Object.keys(updatedGrievances).find((status) =>
        updatedGrievances[status].some((grievance) => grievance._id.toString() === grievanceId)
      );
  
      if (!oldStatus) {
        throw new Error("Grievance not found in any list.");
      }
  
      // Find the grievance to maintain its properties and rank
      const grievanceToMove = originalGrievances[oldStatus].find(
        (grievance) => grievance._id.toString() === grievanceId
      );
  
      // Remove the grievance from the old status list
      updatedGrievances[oldStatus] = updatedGrievances[oldStatus].filter(
        (grievance) => grievance._id.toString() !== grievanceId
      );
  
      // Add the grievance to the new status list at the end (or maintain a position/rank)
      updatedGrievances[newStatus] = [
        ...updatedGrievances[newStatus],
        { ...grievanceToMove, status: newStatus }
      ];
  
      // Update the state
      setGrievances(updatedGrievances);
  
      // Prepare data for API call
      const data = { status: newStatus };
  
      // Call the API to update the grievance status
      const response = await updateGrievance({ id: grievanceId, data });
  
      if (response.error) {
        throw new Error(response.error.data.message);
      }
  
    } catch (error) {
      console.log("Error updating grievance status:", error.message);
      toast.error(error.message);
  
      // Revert the state if the API call fails
      setGrievances(originalGrievances);
    }
  };
  

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId !== destination.droppableId) {
      onDragEnd(draggableId, destination.droppableId);
    }
  };

  useEffect(() => {
    if (submittedGrievance?.data?.grievances) {
      updateGrievances(
        "submitted",
        submittedGrievance.data.grievances,
        submittedGrievance.data.pagination.hasNextPage
      );
    }
  }, [submittedGrievance]);

  useEffect(() => {
    if (inProgressGrievance?.data?.grievances) {
      updateGrievances(
        "in-progress",
        inProgressGrievance.data.grievances,
        inProgressGrievance.data.pagination.hasNextPage
      );
    }
  }, [inProgressGrievance])

  useEffect(() => {
    if (resolvedGrievance?.data?.grievances) {
      updateGrievances(
        "resolved",
        resolvedGrievance.data.grievances,
        resolvedGrievance.data.pagination.hasNextPage
      );
    }
  }, [resolvedGrievance])

  useEffect(() => {
    if (dismissedGrievance?.data?.grievances) {
      updateGrievances(
        "dismissed",
        dismissedGrievance.data.grievances,
        dismissedGrievance.data.pagination.hasNextPage
      );
    }
  }, [dismissedGrievance])

  useEffect(() => {
    socket.on("update_grievance", (msg) => {
      setGrievances((prevGrievances) => {
        const updatedGrievance = msg.updatedData;
        const newStatus = updatedGrievance.status;
  
        const oldStatus = Object.keys(prevGrievances).find((status) =>
          prevGrievances[status].some((grievance) => grievance._id === updatedGrievance._id)
        );
  
        if (!oldStatus) return prevGrievances;
  
        // Remove from the old status list
        const updatedOldList = prevGrievances[oldStatus].filter(
          (grievance) => grievance._id !== updatedGrievance._id
        );
  
        // Add or update the grievance in the new status list
        const updatedNewList = [...prevGrievances[newStatus].filter(
          (grievance) => grievance._id !== updatedGrievance._id
        ), updatedGrievance];
  
        return {
          ...prevGrievances,
          [oldStatus]: updatedOldList,
          [newStatus]: updatedNewList,
        };
      });
    });
  
    return () => {
      socket.off("update_grievance");
    };
  }, [socket]);
  
  
  

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto overflow-y-hidden h-[calc(100vh-220px)] p-4 pb-0">
        {lists.map((list) => (
          <GrievanceList
            key={list}
            list={list}
            grievances={grievances[list]}
            location={location}
            hasNextPage={hasNextPage[list]}
            page={page[list]}
            onPageChange={handlePageChange}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default GrievanceBoardView;