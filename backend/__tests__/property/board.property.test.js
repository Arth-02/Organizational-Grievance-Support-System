/**
 * Property-Based Tests for Board Service
 * Feature: project-module
 * 
 * These tests validate universal properties that should hold for all valid inputs.
 * Tests focus on the board creation and validation logic.
 */

const fc = require("fast-check");
const mongoose = require("mongoose");
const {
  createBoardSchema,
  updateBoardSchema,
} = require("../../validators/board.validator");
const { DEFAULT_COLUMNS } = require("../../services/board.service");

// Generators for test data
const generateValidObjectId = () =>
  fc.constant(null).map(() => new mongoose.Types.ObjectId().toString());

const generateValidBoardName = () =>
  fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length >= 1)
    .map(s => s.trim());

const alphanumericWithHyphen = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';

const generateValidColumnKey = () =>
  fc.array(fc.constantFrom(...alphanumericWithHyphen.split('')), { minLength: 1, maxLength: 20 })
    .map(arr => arr.join(''))
    .filter(s => /^[a-zA-Z0-9-]+$/.test(s) && s.length >= 1);

const generateValidColumn = (order) =>
  fc.record({
    key: generateValidColumnKey(),
    label: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length >= 1),
    order: fc.constant(order),
  });

describe("Board Service Property Tests", () => {
  /**
   * Property 5: Default Board Creation
   * 
   * *For any* successful project creation, the Board_Service SHALL automatically 
   * create exactly one default board with columns "To Do" (order 0), 
   * "In Progress" (order 1), and "Done" (order 2).
   * 
   * **Validates: Requirements 3.1**
   */
  describe("Property 5: Default Board Creation", () => {
    
    it("should have exactly three default columns", () => {
      // Property: Default board must have exactly 3 columns
      expect(DEFAULT_COLUMNS).toHaveLength(3);
    });

    it("should have 'To Do' column with order 0", () => {
      // Property: First column must be "To Do" with order 0
      const todoColumn = DEFAULT_COLUMNS.find(col => col.key === "todo");
      expect(todoColumn).toBeDefined();
      expect(todoColumn.label).toBe("To Do");
      expect(todoColumn.order).toBe(0);
    });

    it("should have 'In Progress' column with order 1", () => {
      // Property: Second column must be "In Progress" with order 1
      const inProgressColumn = DEFAULT_COLUMNS.find(col => col.key === "in-progress");
      expect(inProgressColumn).toBeDefined();
      expect(inProgressColumn.label).toBe("In Progress");
      expect(inProgressColumn.order).toBe(1);
    });

    it("should have 'Done' column with order 2", () => {
      // Property: Third column must be "Done" with order 2
      const doneColumn = DEFAULT_COLUMNS.find(col => col.key === "done");
      expect(doneColumn).toBeDefined();
      expect(doneColumn.label).toBe("Done");
      expect(doneColumn.order).toBe(2);
    });

    it("should have unique column keys in default columns", () => {
      // Property: All column keys must be unique
      const keys = DEFAULT_COLUMNS.map(col => col.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it("should have sequential order values starting from 0", () => {
      // Property: Order values must be sequential starting from 0
      const orders = DEFAULT_COLUMNS.map(col => col.order).sort((a, b) => a - b);
      orders.forEach((order, index) => {
        expect(order).toBe(index);
      });
    });

    it("should have valid column keys (alphanumeric with hyphens)", async () => {
      // Property: All default column keys must match the valid pattern
      await fc.assert(
        fc.property(
          fc.constantFrom(...DEFAULT_COLUMNS),
          (column) => {
            const keyPattern = /^[a-zA-Z0-9-]+$/;
            expect(column.key).toMatch(keyPattern);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should have non-empty labels for all default columns", () => {
      // Property: All column labels must be non-empty strings
      DEFAULT_COLUMNS.forEach(column => {
        expect(typeof column.label).toBe("string");
        expect(column.label.trim().length).toBeGreaterThan(0);
      });
    });

    it("should maintain column structure consistency for any valid project", async () => {
      // Property: For any valid project ID and organization ID, 
      // the default columns structure should remain constant
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          generateValidObjectId(),
          (projectId, orgId) => {
            // The DEFAULT_COLUMNS should be the same regardless of project/org
            expect(DEFAULT_COLUMNS).toEqual([
              { key: "todo", label: "To Do", order: 0 },
              { key: "in-progress", label: "In Progress", order: 1 },
              { key: "done", label: "Done", order: 2 },
            ]);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Board Validation Properties
   * Additional properties for board validation
   */
  describe("Board Validation Properties", () => {
    
    it("should accept valid board creation requests with unique column keys", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          generateValidBoardName(),
          (projectId, name) => {
            const { error, value } = createBoardSchema.validate({
              project_id: projectId,
              name,
              columns: [
                { key: "col1", label: "Column 1", order: 0 },
                { key: "col2", label: "Column 2", order: 1 },
              ],
            });

            // Property: Valid board data should be accepted
            expect(error).toBeUndefined();
            expect(value.project_id).toBe(projectId);
            expect(value.name).toBe(name.trim());
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject board creation with duplicate column keys", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          generateValidBoardName(),
          generateValidColumnKey(),
          (projectId, name, duplicateKey) => {
            const { error } = createBoardSchema.validate({
              project_id: projectId,
              name,
              columns: [
                { key: duplicateKey, label: "Column 1", order: 0 },
                { key: duplicateKey, label: "Column 2", order: 1 },
              ],
            });

            // Property: Duplicate column keys should be rejected
            expect(error).toBeDefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject board creation with empty columns array", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          generateValidBoardName(),
          (projectId, name) => {
            const { error } = createBoardSchema.validate({
              project_id: projectId,
              name,
              columns: [],
            });

            // Property: Empty columns array should be rejected
            expect(error).toBeDefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject column keys with invalid characters", async () => {
      const invalidKeys = [
        'col key',    // space
        'col_key',    // underscore
        'col!key',    // exclamation
        'col@key',    // at sign
        'col#key',    // hash
        'col$key',    // dollar
      ];

      for (const invalidKey of invalidKeys) {
        const { error } = createBoardSchema.validate({
          project_id: new mongoose.Types.ObjectId().toString(),
          name: "Test Board",
          columns: [
            { key: invalidKey, label: "Column 1", order: 0 },
          ],
        });
        expect(error).toBeDefined();
      }
    });

    it("should accept column keys with valid alphanumeric and hyphen characters", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          generateValidColumnKey(),
          (projectId, validKey) => {
            const { error } = createBoardSchema.validate({
              project_id: projectId,
              name: "Test Board",
              columns: [
                { key: validKey, label: "Column 1", order: 0 },
              ],
            });

            // Property: Valid column keys should be accepted
            expect(error).toBeUndefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Column Order Integrity Properties
   */
  describe("Column Order Integrity Properties", () => {
    
    it("should accept columns with any valid order values", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.array(fc.nat({ max: 100 }), { minLength: 1, maxLength: 5 }),
          (projectId, orders) => {
            // Create unique keys for each column
            const columns = orders.map((order, index) => ({
              key: `col-${index}`,
              label: `Column ${index}`,
              order,
            }));

            const { error } = createBoardSchema.validate({
              project_id: projectId,
              name: "Test Board",
              columns,
            });

            // Property: Any valid order values should be accepted
            expect(error).toBeUndefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject negative order values", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.integer({ min: -1000, max: -1 }),
          (projectId, negativeOrder) => {
            const { error } = createBoardSchema.validate({
              project_id: projectId,
              name: "Test Board",
              columns: [
                { key: "col1", label: "Column 1", order: negativeOrder },
              ],
            });

            // Property: Negative order values should be rejected
            expect(error).toBeDefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
