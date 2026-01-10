const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  commentSchema,
} = require("../../../validators/task.validator");
const mongoose = require("mongoose");

describe("Task Validator", () => {
  const validProjectId = new mongoose.Types.ObjectId().toString();
  const validUserId = new mongoose.Types.ObjectId().toString();

  describe("createTaskSchema", () => {
    describe("title validation", () => {
      it("should accept valid task title (3-200 chars)", () => {
        const validData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject task title shorter than 3 characters", () => {
        const invalidData = {
          project_id: validProjectId,
          title: "AB",
          status: "todo",
        };
        const { error } = createTaskSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("at least 3 characters");
      });

      it("should reject task title longer than 200 characters", () => {
        const invalidData = {
          project_id: validProjectId,
          title: "A".repeat(201),
          status: "todo",
        };
        const { error } = createTaskSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("must not exceed 200 characters");
      });

      it("should reject empty task title", () => {
        const invalidData = {
          project_id: validProjectId,
          title: "",
          status: "todo",
        };
        const { error } = createTaskSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject missing task title", () => {
        const invalidData = {
          project_id: validProjectId,
          status: "todo",
        };
        const { error } = createTaskSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("required");
      });


      it("should accept task title with exactly 3 characters", () => {
        const validData = {
          project_id: validProjectId,
          title: "ABC",
          status: "todo",
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept task title with exactly 200 characters", () => {
        const validData = {
          project_id: validProjectId,
          title: "A".repeat(200),
          status: "todo",
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe("description validation", () => {
      it("should accept valid description", () => {
        const validData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
          description: "This is a task description",
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept description with exactly 5000 characters", () => {
        const validData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
          description: "A".repeat(5000),
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject description longer than 5000 characters", () => {
        const invalidData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
          description: "A".repeat(5001),
        };
        const { error } = createTaskSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("must not exceed 5000 characters");
      });

      it("should accept empty description", () => {
        const validData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
          description: "",
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept missing description", () => {
        const validData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });


    describe("type validation", () => {
      it("should accept valid task types", () => {
        const types = ["task", "bug", "story", "epic", "subtask"];
        types.forEach((type) => {
          const validData = {
            project_id: validProjectId,
            title: "My Task",
            status: "todo",
            type: type,
          };
          const { error } = createTaskSchema.validate(validData);
          expect(error).toBeUndefined();
        });
      });

      it("should reject invalid task type", () => {
        const invalidData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
          type: "invalid_type",
        };
        const { error } = createTaskSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("task, bug, story, epic, subtask");
      });

      it("should default to task type when not provided", () => {
        const validData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
        };
        const { error, value } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
        expect(value.type).toBe("task");
      });
    });

    describe("priority validation", () => {
      it("should accept valid priority values", () => {
        const priorities = ["lowest", "low", "medium", "high", "highest"];
        priorities.forEach((priority) => {
          const validData = {
            project_id: validProjectId,
            title: "My Task",
            status: "todo",
            priority: priority,
          };
          const { error } = createTaskSchema.validate(validData);
          expect(error).toBeUndefined();
        });
      });

      it("should reject invalid priority", () => {
        const invalidData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
          priority: "critical",
        };
        const { error } = createTaskSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("lowest, low, medium, high, highest");
      });

      it("should default to medium priority when not provided", () => {
        const validData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
        };
        const { error, value } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
        expect(value.priority).toBe("medium");
      });
    });

    describe("required fields validation", () => {
      it("should reject missing project_id", () => {
        const invalidData = {
          title: "My Task",
          status: "todo",
        };
        const { error } = createTaskSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("required");
      });

      it("should reject missing status", () => {
        const invalidData = {
          project_id: validProjectId,
          title: "My Task",
        };
        const { error } = createTaskSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("required");
      });

      it("should reject invalid project_id", () => {
        const invalidData = {
          project_id: "invalid-id",
          title: "My Task",
          status: "todo",
        };
        const { error } = createTaskSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe("optional fields validation", () => {
      it("should accept valid assignee ObjectId", () => {
        const validData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
          assignee: validUserId,
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept null assignee", () => {
        const validData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
          assignee: null,
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept valid parent_id ObjectId", () => {
        const validParentId = new mongoose.Types.ObjectId().toString();
        const validData = {
          project_id: validProjectId,
          title: "My Subtask",
          status: "todo",
          type: "subtask",
          parent_id: validParentId,
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept valid due_date", () => {
        const validData = {
          project_id: validProjectId,
          title: "My Task",
          status: "todo",
          due_date: new Date(),
        };
        const { error } = createTaskSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });
  });


  describe("updateTaskSchema", () => {
    it("should accept partial updates with title only", () => {
      const validData = {
        title: "Updated Task Title",
      };
      const { error } = updateTaskSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should validate title length on update", () => {
      const invalidData = {
        title: "AB",
      };
      const { error } = updateTaskSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("at least 3 characters");
    });

    it("should validate title max length on update", () => {
      const invalidData = {
        title: "A".repeat(201),
      };
      const { error } = updateTaskSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("must not exceed 200 characters");
    });

    it("should validate description max length on update", () => {
      const invalidData = {
        description: "A".repeat(5001),
      };
      const { error } = updateTaskSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("must not exceed 5000 characters");
    });

    it("should not require any fields", () => {
      const validData = {};
      const { error } = updateTaskSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should accept valid priority on update", () => {
      const validData = {
        priority: "high",
      };
      const { error } = updateTaskSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should reject invalid priority on update", () => {
      const invalidData = {
        priority: "invalid",
      };
      const { error } = updateTaskSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it("should accept null assignee on update", () => {
      const validData = {
        assignee: null,
      };
      const { error } = updateTaskSchema.validate(validData);
      expect(error).toBeUndefined();
    });
  });

  describe("updateTaskStatusSchema", () => {
    it("should accept valid status update", () => {
      const validData = {
        status: "in-progress",
      };
      const { error } = updateTaskStatusSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should accept status with rank values", () => {
      const validData = {
        status: "done",
        prevRank: "0|hzzzzz:",
        nextRank: "0|i00000:",
      };
      const { error } = updateTaskStatusSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should accept null rank values", () => {
      const validData = {
        status: "done",
        prevRank: null,
        nextRank: null,
      };
      const { error } = updateTaskStatusSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should reject missing status", () => {
      const invalidData = {};
      const { error } = updateTaskStatusSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("required");
    });

    it("should reject empty status", () => {
      const invalidData = {
        status: "",
      };
      const { error } = updateTaskStatusSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe("commentSchema", () => {
    it("should accept valid comment message", () => {
      const validData = {
        message: "This is a comment",
      };
      const { error } = commentSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should reject empty comment message", () => {
      const invalidData = {
        message: "",
      };
      const { error } = commentSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it("should reject missing comment message", () => {
      const invalidData = {};
      const { error } = commentSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("required");
    });

    it("should reject comment message longer than 5000 characters", () => {
      const invalidData = {
        message: "A".repeat(5001),
      };
      const { error } = commentSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("must not exceed 5000 characters");
    });

    it("should accept comment message with exactly 5000 characters", () => {
      const validData = {
        message: "A".repeat(5000),
      };
      const { error } = commentSchema.validate(validData);
      expect(error).toBeUndefined();
    });
  });
});
