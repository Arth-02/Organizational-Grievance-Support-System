const boardService = require("../services/board.service");

// Create a new board
const createBoard = async (organization_id) => {
  try {
    const response = await boardService.createBoard(organization_id);
    if (!response.isSuccess) {
      return errorResponse(res, 400, response.message);
    }
    return successResponse(res, response.board, "Board created successfully");
  } catch (err) {
    console.error("Create Board Error:", err.message);
    return catchResponse(res);
  }
};
