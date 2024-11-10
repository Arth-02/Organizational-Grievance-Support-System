/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { DragDropContext } from "@hello-pangea/dnd";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import GrievanceList from "./GrievanceList";
import toast from "react-hot-toast";
import useSocket from "@/utils/useSocket";
import { useGetAllGrievancesQuery, useUpdateGrievanceMutation, useUpdateGrievanceStatusMutation } from "@/services/grievance.service";

const GrievanceBoardView = () => {
  const lists = ["submitted", "in-progress", "resolved", "dismissed"];
  const location = useLocation();

  const [updateGrievance] = useUpdateGrievanceMutation();
  const [updateGrievanceStatus] = useUpdateGrievanceStatusMutation();

  const socket = useSocket();

  const [filters, setFilters] = useState({});

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
  const [totalGrievancesCount, setTotalGrievancesCount] = useState({
    submitted: 0,
    "in-progress": 0,
    resolved: 0,
    dismissed: 0,
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

  const updateGrievances = (status, newGrievances, hasNextPageStatus, totalCount) => {
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

    setTotalGrievancesCount((prev) => ({
      ...prev,
      [status]: totalCount,
    }));
  };

  const onDragEnd = async (
    grievanceId,
    newStatus,
    destinationDraggableProps
  ) => {
    let originalGrievances;
    let originalGrievacesCount;

    try {
      // Create a deep copy of the original state for backup
      originalGrievances = JSON.parse(JSON.stringify(grievances));

      // Create a deep copy of the original count state for backup
      originalGrievacesCount = JSON.parse(JSON.stringify(totalGrievancesCount));

      // Get the previous and next grievance ranks in the destination list
      let destinationGrievances = [...grievances[newStatus]];
      const destinationIndex = destinationDraggableProps.index;
      destinationGrievances = destinationGrievances.filter(
        (grievance) => grievance._id !== grievanceId
      );
      const prevRank =
        destinationIndex > 0
          ? destinationGrievances[destinationIndex - 1].rank
          : null;

      const nextRank =
        destinationIndex < destinationGrievances.length
          ? destinationGrievances[destinationIndex].rank
          : null;

      // Create a new copy of the grievances object
      const updatedGrievances = Object.keys(grievances).reduce(
        (acc, status) => {
          acc[status] = [...grievances[status]];
          return acc;
        },
        {}
      );

      // Find the old status
      const oldStatus = Object.keys(updatedGrievances).find((status) =>
        updatedGrievances[status].some(
          (grievance) => grievance._id === grievanceId
        )
      );

      if (!oldStatus) {
        throw new Error("Grievance not found in any list.");
      }

      // Find the grievance to move
      const grievanceToMove = updatedGrievances[oldStatus].find(
        (grievance) => grievance._id === grievanceId
      );

      if (!grievanceToMove) {
        throw new Error("Grievance not found.");
      }

      // Remove from old status
      updatedGrievances[oldStatus] = updatedGrievances[oldStatus].filter(
        (grievance) => grievance._id !== grievanceId
      );

      // Create new array for destination status if it doesn't exist
      if (!updatedGrievances[newStatus]) {
        updatedGrievances[newStatus] = [];
      }

      // Create a new array with the inserted item
      const updatedDestinationArray = [...updatedGrievances[newStatus]];
      updatedDestinationArray.splice(destinationIndex, 0, {
        ...grievanceToMove,
        status: newStatus,
      });

      // Update the destination array
      updatedGrievances[newStatus] = updatedDestinationArray;

      // Update state with the new structure
      setGrievances(updatedGrievances);

      // update count of grievances in the lists
      handleCardMoveCount(oldStatus, newStatus);

      // Call API to update status and rank
      const response = await updateGrievanceStatus({
        id: grievanceId,
        data: {
          status: newStatus,
          prevRank,
          nextRank,
        },
      });

      const updatedGrievance = response.data.data;

      // update the grievance rank in the destination list
      if (updatedGrievance) {
        setGrievances((prevGrievances) => {
          const newStatus = updatedGrievance.status;
          const updatedNewList = prevGrievances[newStatus].map((grievance) =>
            grievance._id === updatedGrievance._id
              ? { ...grievance, rank: updatedGrievance.rank }
              : grievance
          );

          return {
            ...prevGrievances,
            [newStatus]: updatedNewList,
          };
        });
      }

      if (response.error) {
        throw new Error(response.error.data.message);
      }
    } catch (error) {
      console.error("Error updating grievance:", error);
      toast.error(
        error.message || "An error occurred while updating the grievance"
      );
      // Restore the original state
      setGrievances(originalGrievances);

      // Restore the original count state
      setTotalGrievancesCount(originalGrievacesCount);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (
      source.droppableId !== destination.droppableId ||
      source.index !== destination.index
    ) {
      onDragEnd(draggableId, destination.droppableId, destination);
    }
  };

  const handleCardMoveCount = (oldStatus, newStatus) => {
    if (oldStatus === newStatus) return;

    setTotalGrievancesCount((prev) => ({
      ...prev,
      [oldStatus]: prev[oldStatus] - 1,
      [newStatus]: prev[newStatus] + 1,
    }));
  };

  useEffect(() => {
    if (submittedGrievance?.data?.grievances) {
      updateGrievances(
        "submitted",
        submittedGrievance.data.grievances,
        submittedGrievance.data.pagination.hasNextPage,
        submittedGrievance.data.pagination.totalSubmitted
      );
    }
  }, [submittedGrievance]);

  useEffect(() => {
    if (inProgressGrievance?.data?.grievances) {
      updateGrievances(
        "in-progress",
        inProgressGrievance.data.grievances,
        inProgressGrievance.data.pagination.hasNextPage,
        inProgressGrievance.data.pagination.totalInProgress
      );
    }
  }, [inProgressGrievance]);

  useEffect(() => {
    if (resolvedGrievance?.data?.grievances) {
      updateGrievances(
        "resolved",
        resolvedGrievance.data.grievances,
        resolvedGrievance.data.pagination.hasNextPage,
        resolvedGrievance.data.pagination.totalResolved
      );
    }
  }, [resolvedGrievance]);

  useEffect(() => {
    if (dismissedGrievance?.data?.grievances) {
      updateGrievances(
        "dismissed",
        dismissedGrievance.data.grievances,
        dismissedGrievance.data.pagination.hasNextPage,
        dismissedGrievance.data.pagination.totalDismissed
      );
    }
  }, [dismissedGrievance]);

  const handleUpdateGrievance = (msg) => {
    let oldStatus = null;
    setGrievances((prevGrievances) => {
      const updatedGrievance = msg.updatedData;
      const newStatus = updatedGrievance.status;

      // If the grievance is not active, remove it from the new status list
      if (!updatedGrievance.is_active) {
        return {
          ...prevGrievances,
          [newStatus]: prevGrievances[newStatus].filter(
            (grievance) => grievance._id !== updatedGrievance._id
          ),
        };
      }

      // Find the old status of the grievance
      oldStatus = Object.keys(prevGrievances).find((status) =>
        prevGrievances[status].some(
          (grievance) => grievance._id === updatedGrievance._id
        )
      );

      // If the old status is not found, return the previous state
      if (!oldStatus) return prevGrievances;

      // Remove the grievance from the old status list
      const updatedOldList = prevGrievances[oldStatus].filter(
        (grievance) => grievance._id !== updatedGrievance._id
      );

      // Add or update the grievance in the new status list
      const updatedNewList = [
        ...prevGrievances[newStatus].filter(
          (grievance) => grievance._id !== updatedGrievance._id
        ),
        updatedGrievance,
      ];

      // Sort the new status list by rank
      const sortedNewList = updatedNewList.sort((a, b) => {
        return a.rank.localeCompare(b.rank, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });

      return {
        ...prevGrievances,
        [oldStatus]: updatedOldList,
        [newStatus]: sortedNewList,
      };
    });

    handleCardMoveCount(oldStatus, msg.updatedData.status);
  };

  useEffect(() => {
    socket.on("update_grievance", handleUpdateGrievance);

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
            isInisialized={isInitialized[list]}
            totalGrievancesCount={totalGrievancesCount[list]}
            onPageChange={handlePageChange}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default GrievanceBoardView;
