const {
  createBoardSchema,
  updateBoardSchema,
} = require("../../../validators/board.validator");
const mongoose = require("mongoose");

describe("Board Validator", () => {
  const validProjectId = new mongoose.Types.ObjectId().toString();
  const validColumns = [
    { key: "todo", label: "To Do", order: 0 },
    { key: "in-progress", label: "In Progress", order: 1 },
    { key: "done", label: "Done", order: 2 },
  ];

  describe("createBoardSchema", () => {
    describe("column key validation", () => {
      it("should accept valid alphanumeric column keys", () => {
        const validData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [{ key: "todo", label: "To Do", order: 0 }],
        };
        const { error } = createBoardSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept column keys with hyphens", () => {
        const validData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [{ key: "in-progress", label: "In Progress", order: 0 }],
        };
        const { error } = createBoardSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept column keys with numbers", () => {
        const validData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [{ key: "stage1", label: "Stage 1", order: 0 }],
        };
        const { error } = createBoardSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject column keys with special characters (except hyphen)", () => {
        const invalidData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [{ key: "to_do", label: "To Do", order: 0 }],
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("alphanumeric with hyphens");
      });

      it("should reject column keys with spaces", () => {
        const invalidData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [{ key: "to do", label: "To Do", order: 0 }],
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject empty column key", () => {
        const invalidData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [{ key: "", label: "To Do", order: 0 }],
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject duplicate column keys", () => {
        const invalidData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [
            { key: "todo", label: "To Do", order: 0 },
            { key: "todo", label: "Also To Do", order: 1 },
          ],
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("unique");
      });
    });

    describe("required fields validation", () => {
      it("should accept valid board data with all required fields", () => {
        const validData = {
          project_id: validProjectId,
          name: "My Board",
          columns: validColumns,
        };
        const { error } = createBoardSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject missing project_id", () => {
        const invalidData = {
          name: "My Board",
          columns: validColumns,
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("required");
      });

      it("should reject missing name", () => {
        const invalidData = {
          project_id: validProjectId,
          columns: validColumns,
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("required");
      });

      it("should reject missing columns", () => {
        const invalidData = {
          project_id: validProjectId,
          name: "My Board",
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("required");
      });

      it("should reject empty columns array", () => {
        const invalidData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [],
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message.toLowerCase()).toContain("at least one column");
      });
    });

    describe("column structure validation", () => {
      it("should reject column without label", () => {
        const invalidData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [{ key: "todo", order: 0 }],
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject column without order", () => {
        const invalidData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [{ key: "todo", label: "To Do" }],
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject negative order value", () => {
        const invalidData = {
          project_id: validProjectId,
          name: "My Board",
          columns: [{ key: "todo", label: "To Do", order: -1 }],
        };
        const { error } = createBoardSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });
  });

  describe("updateBoardSchema", () => {
    it("should accept partial updates with name only", () => {
      const validData = {
        name: "Updated Board Name",
      };
      const { error } = updateBoardSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should accept partial updates with columns only", () => {
      const validData = {
        columns: validColumns,
      };
      const { error } = updateBoardSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should accept is_active update", () => {
      const validData = {
        is_active: false,
      };
      const { error } = updateBoardSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should not require any fields", () => {
      const validData = {};
      const { error } = updateBoardSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should validate column keys on update", () => {
      const invalidData = {
        columns: [{ key: "invalid_key", label: "Test", order: 0 }],
      };
      const { error } = updateBoardSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("alphanumeric with hyphens");
    });
  });
});
