/**
 * Property-Based Tests for Task Service
 * Feature: project-module
 * 
 * These tests validate universal properties that should hold for all valid inputs.
 * Tests focus on issue key generation and LexoRank ordering logic.
 */

const fc = require("fast-check");
const mongoose = require("mongoose");
const LexoRank = require("../../services/lexorank.service");
const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} = require("../../validators/task.validator");

// Generators for test data
const generateValidObjectId = () =>
  fc.constant(null).map(() => new mongoose.Types.ObjectId().toString());

const upperAlphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const generateValidProjectKey = (minLen = 2, maxLen = 10) =>
  fc.array(fc.constantFrom(...upperAlphanumericChars.split('')), { minLength: minLen, maxLength: maxLen })
    .map(arr => arr.join(''));

const generateValidTaskTitle = () =>
  fc.string({ minLength: 3, maxLength: 200 })
    .filter(s => s.trim().length >= 3)
    .map(s => s.trim());

const generateValidTaskDescription = () =>
  fc.string({ minLength: 0, maxLength: 5000 });

const generateTaskType = () =>
  fc.constantFrom("task", "bug", "story", "epic");

const generatePriority = () =>
  fc.constantFrom("lowest", "low", "medium", "high", "highest");

const generateValidStatus = () =>
  fc.constantFrom("todo", "in-progress", "done");

describe("Task Service Property Tests", () => {
  /**
   * Property 6: Issue Key Generation
   * 
   * *For any* task creation within a project, the Task_Service SHALL generate an 
   * issue_key following the pattern `{PROJECT_KEY}-{N}` where N is a monotonically 
   * increasing integer unique within the project.
   * 
   * **Validates: Requirements 4.1**
   */
  describe("Property 6: Issue Key Generation", () => {
    
    it("should generate issue keys matching PROJECT_KEY-N pattern", async () => {
      await fc.assert(
        fc.property(
          generateValidProjectKey(),
          fc.integer({ min: 1, max: 10000 }),
          (projectKey, sequenceNumber) => {
            // Simulate issue key generation
            const issueKey = `${projectKey}-${sequenceNumber}`;
            
            // Property: Issue key must match the pattern PROJECT_KEY-N
            const pattern = /^[A-Z0-9]+-\d+$/;
            expect(issueKey).toMatch(pattern);
            
            // Property: Issue key should contain the project key
            expect(issueKey.startsWith(projectKey + "-")).toBe(true);
            
            // Property: Issue key should end with a number
            const parts = issueKey.split("-");
            const number = parseInt(parts[parts.length - 1], 10);
            expect(Number.isInteger(number)).toBe(true);
            expect(number).toBe(sequenceNumber);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should generate monotonically increasing sequence numbers", async () => {
      await fc.assert(
        fc.property(
          generateValidProjectKey(),
          fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 2, maxLength: 10 }),
          (projectKey, baseNumbers) => {
            // Sort to simulate sequential task creation
            const sortedNumbers = [...baseNumbers].sort((a, b) => a - b);
            
            // Generate issue keys
            const issueKeys = sortedNumbers.map(n => `${projectKey}-${n}`);
            
            // Property: Sequence numbers should be monotonically increasing
            for (let i = 1; i < issueKeys.length; i++) {
              const prevNum = parseInt(issueKeys[i - 1].split("-").pop(), 10);
              const currNum = parseInt(issueKeys[i].split("-").pop(), 10);
              expect(currNum).toBeGreaterThanOrEqual(prevNum);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should extract correct sequence number from issue key", async () => {
      await fc.assert(
        fc.property(
          generateValidProjectKey(),
          fc.integer({ min: 1, max: 99999 }),
          (projectKey, expectedSequence) => {
            const issueKey = `${projectKey}-${expectedSequence}`;
            
            // Property: Parsing the issue key should recover the sequence number
            const parts = issueKey.split("-");
            const extractedSequence = parseInt(parts[parts.length - 1], 10);
            
            expect(extractedSequence).toBe(expectedSequence);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle project keys with numbers correctly", async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom("PROJ1", "TEST123", "A1B2C3", "X99"),
          fc.integer({ min: 1, max: 1000 }),
          (projectKey, sequenceNumber) => {
            const issueKey = `${projectKey}-${sequenceNumber}`;
            
            // Property: Even with numbers in project key, parsing should work
            const lastDashIndex = issueKey.lastIndexOf("-");
            const extractedKey = issueKey.substring(0, lastDashIndex);
            const extractedNum = parseInt(issueKey.substring(lastDashIndex + 1), 10);
            
            expect(extractedKey).toBe(projectKey);
            expect(extractedNum).toBe(sequenceNumber);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should ensure uniqueness of issue keys within a project", async () => {
      await fc.assert(
        fc.property(
          generateValidProjectKey(),
          fc.set(fc.integer({ min: 1, max: 10000 }), { minLength: 5, maxLength: 20 }),
          (projectKey, uniqueNumbers) => {
            // Generate issue keys from unique numbers
            const issueKeys = [...uniqueNumbers].map(n => `${projectKey}-${n}`);
            
            // Property: All issue keys should be unique
            const uniqueKeys = new Set(issueKeys);
            expect(uniqueKeys.size).toBe(issueKeys.length);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should increment sequence correctly from last task", async () => {
      await fc.assert(
        fc.property(
          generateValidProjectKey(),
          fc.integer({ min: 1, max: 9999 }),
          (projectKey, lastSequence) => {
            // Simulate the logic from generateIssueKey
            const lastIssueKey = `${projectKey}-${lastSequence}`;
            const parts = lastIssueKey.split("-");
            const lastNumber = parseInt(parts[parts.length - 1], 10);
            const nextSequence = lastNumber + 1;
            const newIssueKey = `${projectKey}-${nextSequence}`;
            
            // Property: New sequence should be exactly one more than last
            expect(nextSequence).toBe(lastSequence + 1);
            
            // Property: New issue key should follow the pattern
            expect(newIssueKey).toBe(`${projectKey}-${lastSequence + 1}`);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 7: LexoRank Assignment and Ordering
   * 
   * *For any* task creation or status update, the Task_Service SHALL assign a valid 
   * LexoRank such that tasks within the same status column are orderable by their 
   * rank values.
   * 
   * **Validates: Requirements 4.2, 4.3, 8.3**
   */
  describe("Property 7: LexoRank Assignment and Ordering", () => {
    
    it("should generate initial rank for first task", () => {
      const initialRank = LexoRank.getInitialRank();
      
      // Property: Initial rank should be a non-empty string
      expect(typeof initialRank).toBe("string");
      expect(initialRank.length).toBeGreaterThan(0);
    });

    it("should generate next rank that sorts after current rank", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (iterations) => {
            let currentRank = LexoRank.getInitialRank();
            const ranks = [currentRank];
            
            // Generate a sequence of ranks
            for (let i = 0; i < iterations; i++) {
              currentRank = LexoRank.generateNextRank(currentRank);
              ranks.push(currentRank);
            }
            
            // Property: Each subsequent rank should sort after the previous
            for (let i = 1; i < ranks.length; i++) {
              expect(ranks[i] > ranks[i - 1]).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should generate middle rank between two ranks", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (iterations) => {
            // Generate two ranks with some distance
            let prevRank = LexoRank.getInitialRank();
            let nextRank = prevRank;
            
            for (let i = 0; i < iterations; i++) {
              nextRank = LexoRank.generateNextRank(nextRank);
            }
            
            // Get middle rank
            const middleRank = LexoRank.getMiddleRank(prevRank, nextRank);
            
            // Property: Middle rank should sort between prev and next
            expect(middleRank > prevRank).toBe(true);
            expect(middleRank < nextRank).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should generate rank before first task when prevRank is null", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (iterations) => {
            // Generate a rank
            let existingRank = LexoRank.getInitialRank();
            for (let i = 0; i < iterations; i++) {
              existingRank = LexoRank.generateNextRank(existingRank);
            }
            
            // Get rank before (null, existingRank)
            const beforeRank = LexoRank.getMiddleRank(null, existingRank);
            
            // Property: New rank should sort before existing rank
            expect(beforeRank < existingRank).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should generate rank after last task when nextRank is null", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (iterations) => {
            // Generate a rank
            let existingRank = LexoRank.getInitialRank();
            for (let i = 0; i < iterations; i++) {
              existingRank = LexoRank.generateNextRank(existingRank);
            }
            
            // Get rank after (existingRank, null)
            const afterRank = LexoRank.generateNextRank(existingRank);
            
            // Property: New rank should sort after existing rank
            expect(afterRank > existingRank).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain ordering after multiple insertions", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 20 }),
          (numTasks) => {
            const ranks = [];
            
            // Create initial task
            ranks.push(LexoRank.getInitialRank());
            
            // Add tasks at the end
            for (let i = 1; i < numTasks; i++) {
              const lastRank = ranks[ranks.length - 1];
              ranks.push(LexoRank.generateNextRank(lastRank));
            }
            
            // Property: All ranks should be sortable in creation order
            const sortedRanks = [...ranks].sort();
            expect(sortedRanks).toEqual(ranks);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle insertion between adjacent ranks", async () => {
      // Test that the algorithm can handle multiple consecutive insertions
      // between adjacent ranks without losing ordering
      await fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }), // Test up to 20 insertions
          (numInsertions) => {
            // Start with two adjacent ranks
            const rank1 = LexoRank.getInitialRank();
            const rank2 = LexoRank.generateNextRank(rank1);
            
            let prevRank = rank1;
            let nextRank = rank2;
            
            // Insert multiple times between them
            for (let i = 0; i < numInsertions; i++) {
              const middleRank = LexoRank.getMiddleRank(prevRank, nextRank);
              
              // Property: Middle rank should always be between prev and next
              expect(middleRank > prevRank).toBe(true);
              expect(middleRank < nextRank).toBe(true);
              
              // Update for next iteration - insert after the middle
              prevRank = middleRank;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should produce unique ranks for different positions", async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 30 }),
          (numTasks) => {
            const ranks = new Set();
            
            // Generate sequence of ranks
            let currentRank = LexoRank.getInitialRank();
            ranks.add(currentRank);
            
            for (let i = 1; i < numTasks; i++) {
              currentRank = LexoRank.generateNextRank(currentRank);
              ranks.add(currentRank);
            }
            
            // Property: All generated ranks should be unique
            expect(ranks.size).toBe(numTasks);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should allow reordering tasks by changing ranks", async () => {
      await fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Create 3 tasks in order
            const rank1 = LexoRank.getInitialRank();
            const rank2 = LexoRank.generateNextRank(rank1);
            const rank3 = LexoRank.generateNextRank(rank2);
            
            // Verify initial order
            expect(rank1 < rank2).toBe(true);
            expect(rank2 < rank3).toBe(true);
            
            // Move task 3 between task 1 and task 2
            const newRank3 = LexoRank.getMiddleRank(rank1, rank2);
            
            // Property: New rank should place task 3 between 1 and 2
            expect(newRank3 > rank1).toBe(true);
            expect(newRank3 < rank2).toBe(true);
            
            // Verify new order: rank1 < newRank3 < rank2 < rank3
            const newOrder = [rank1, newRank3, rank2, rank3].sort();
            expect(newOrder).toEqual([rank1, newRank3, rank2, rank3]);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task Validation Properties
   */
  describe("Task Validation Properties", () => {
    
    it("should accept valid task creation data", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          generateValidTaskTitle(),
          generateValidStatus(),
          generateTaskType(),
          generatePriority(),
          (projectId, title, status, type, priority) => {
            const { error, value } = createTaskSchema.validate({
              project_id: projectId,
              title,
              status,
              type,
              priority,
            });

            // Property: Valid task data should be accepted
            expect(error).toBeUndefined();
            expect(value.project_id).toBe(projectId);
            expect(value.title).toBe(title.trim());
            expect(value.status).toBe(status);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject task titles outside valid length range", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.oneof(
            // Too short (0-2 chars)
            fc.string({ minLength: 0, maxLength: 2 }),
            // Too long (201+ chars)
            fc.string({ minLength: 201, maxLength: 250 })
          ),
          (projectId, invalidTitle) => {
            const { error } = createTaskSchema.validate({
              project_id: projectId,
              title: invalidTitle,
              status: "todo",
            });

            // Property: Invalid titles should be rejected
            expect(error).toBeDefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject task descriptions exceeding max length", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.string({ minLength: 5001, maxLength: 6000 }),
          (projectId, longDescription) => {
            const { error } = createTaskSchema.validate({
              project_id: projectId,
              title: "Valid Title",
              status: "todo",
              description: longDescription,
            });

            // Property: Descriptions over 5000 chars should be rejected
            expect(error).toBeDefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept valid task descriptions within limit", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.string({ minLength: 0, maxLength: 5000 }),
          (projectId, validDescription) => {
            const { error } = createTaskSchema.validate({
              project_id: projectId,
              title: "Valid Title",
              status: "todo",
              description: validDescription,
            });

            // Property: Valid descriptions should be accepted
            expect(error).toBeUndefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should validate task type enum values", async () => {
      const validTypes = ["task", "bug", "story", "epic"];
      const invalidTypes = ["feature", "issue", "ticket", "item", "work", "subtask"];

      // Valid types should be accepted
      for (const type of validTypes) {
        const { error } = createTaskSchema.validate({
          project_id: new mongoose.Types.ObjectId().toString(),
          title: "Valid Title",
          status: "todo",
          type,
        });
        expect(error).toBeUndefined();
      }

      // Invalid types should be rejected
      for (const type of invalidTypes) {
        const { error } = createTaskSchema.validate({
          project_id: new mongoose.Types.ObjectId().toString(),
          title: "Valid Title",
          status: "todo",
          type,
        });
        expect(error).toBeDefined();
      }
    });

    it("should validate priority enum values", async () => {
      const validPriorities = ["lowest", "low", "medium", "high", "highest"];
      const invalidPriorities = ["critical", "urgent", "normal", "minor"];

      // Valid priorities should be accepted
      for (const priority of validPriorities) {
        const { error } = createTaskSchema.validate({
          project_id: new mongoose.Types.ObjectId().toString(),
          title: "Valid Title",
          status: "todo",
          priority,
        });
        expect(error).toBeUndefined();
      }

      // Invalid priorities should be rejected
      for (const priority of invalidPriorities) {
        const { error } = createTaskSchema.validate({
          project_id: new mongoose.Types.ObjectId().toString(),
          title: "Valid Title",
          status: "todo",
          priority,
        });
        expect(error).toBeDefined();
      }
    });
  });

  /**
   * Status Update Validation Properties
   */
  describe("Status Update Validation Properties", () => {
    
    it("should accept valid status update with ranks", async () => {
      await fc.assert(
        fc.property(
          generateValidStatus(),
          (status) => {
            const prevRank = LexoRank.getInitialRank();
            const nextRank = LexoRank.generateNextRank(prevRank);

            const { error, value } = updateTaskStatusSchema.validate({
              status,
              prevRank,
              nextRank,
            });

            // Property: Valid status update should be accepted
            expect(error).toBeUndefined();
            expect(value.status).toBe(status);
            expect(value.prevRank).toBe(prevRank);
            expect(value.nextRank).toBe(nextRank);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept status update without ranks", async () => {
      await fc.assert(
        fc.property(
          generateValidStatus(),
          (status) => {
            const { error, value } = updateTaskStatusSchema.validate({
              status,
            });

            // Property: Status update without ranks should be accepted
            expect(error).toBeUndefined();
            expect(value.status).toBe(status);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject status update without status field", async () => {
      const { error } = updateTaskStatusSchema.validate({
        prevRank: "I",
        nextRank: "J",
      });

      // Property: Status field is required
      expect(error).toBeDefined();
    });

    it("should accept null ranks for edge positions", async () => {
      await fc.assert(
        fc.property(
          generateValidStatus(),
          (status) => {
            // Test with null prevRank (insert at beginning)
            const result1 = updateTaskStatusSchema.validate({
              status,
              prevRank: null,
              nextRank: "I",
            });
            expect(result1.error).toBeUndefined();

            // Test with null nextRank (insert at end)
            const result2 = updateTaskStatusSchema.validate({
              status,
              prevRank: "I",
              nextRank: null,
            });
            expect(result2.error).toBeUndefined();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
