const {
  createProjectSchema,
  updateProjectSchema,
  addMembersSchema,
} = require("../../../validators/project.validator");
const mongoose = require("mongoose");

describe("Project Validator", () => {
  describe("createProjectSchema", () => {
    describe("name validation", () => {
      it("should accept valid project name (3-100 chars)", () => {
        const validData = {
          name: "My Project",
          key: "PROJ",
        };
        const { error } = createProjectSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject project name shorter than 3 characters", () => {
        const invalidData = {
          name: "AB",
          key: "PROJ",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("at least 3 characters");
      });

      it("should reject project name longer than 100 characters", () => {
        const invalidData = {
          name: "A".repeat(101),
          key: "PROJ",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("must not exceed 100 characters");
      });

      it("should reject empty project name", () => {
        const invalidData = {
          name: "",
          key: "PROJ",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject missing project name", () => {
        const invalidData = {
          key: "PROJ",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("required");
      });

      it("should accept project name with exactly 3 characters", () => {
        const validData = {
          name: "ABC",
          key: "PROJ",
        };
        const { error } = createProjectSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept project name with exactly 100 characters", () => {
        const validData = {
          name: "A".repeat(100),
          key: "PROJ",
        };
        const { error } = createProjectSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe("key validation", () => {
      it("should accept valid project key (2-10 uppercase alphanumeric)", () => {
        const validData = {
          name: "My Project",
          key: "PROJ",
        };
        const { error } = createProjectSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept project key with numbers", () => {
        const validData = {
          name: "My Project",
          key: "PROJ123",
        };
        const { error } = createProjectSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should convert lowercase key to uppercase", () => {
        const data = {
          name: "My Project",
          key: "proj",
        };
        const { error, value } = createProjectSchema.validate(data);
        expect(error).toBeUndefined();
        expect(value.key).toBe("PROJ");
      });

      it("should reject project key shorter than 2 characters", () => {
        const invalidData = {
          name: "My Project",
          key: "P",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("at least 2 characters");
      });

      it("should reject project key longer than 10 characters", () => {
        const invalidData = {
          name: "My Project",
          key: "PROJECTKEY1",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("must not exceed 10 characters");
      });

      it("should reject project key with special characters", () => {
        const invalidData = {
          name: "My Project",
          key: "PROJ-1",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("uppercase alphanumeric");
      });

      it("should reject project key with spaces", () => {
        const invalidData = {
          name: "My Project",
          key: "PR OJ",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject empty project key", () => {
        const invalidData = {
          name: "My Project",
          key: "",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject missing project key", () => {
        const invalidData = {
          name: "My Project",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("required");
      });

      it("should accept project key with exactly 2 characters", () => {
        const validData = {
          name: "My Project",
          key: "AB",
        };
        const { error } = createProjectSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept project key with exactly 10 characters", () => {
        const validData = {
          name: "My Project",
          key: "ABCDEFGHIJ",
        };
        const { error } = createProjectSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe("optional fields", () => {
      it("should accept valid ObjectId for manager", () => {
        const validObjectId = new mongoose.Types.ObjectId().toString();
        const validData = {
          name: "My Project",
          key: "PROJ",
          manager: [validObjectId],
        };
        const { error } = createProjectSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should accept valid ObjectId for members", () => {
        const validObjectId = new mongoose.Types.ObjectId().toString();
        const validData = {
          name: "My Project",
          key: "PROJ",
          members: [validObjectId],
        };
        const { error } = createProjectSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject invalid ObjectId for manager", () => {
        const invalidData = {
          name: "My Project",
          key: "PROJ",
          manager: ["invalid-id"],
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should accept valid project_type values", () => {
        const types = ["software", "business", "service_desk"];
        types.forEach((type) => {
          const validData = {
            name: "My Project",
            key: "PROJ",
            project_type: type,
          };
          const { error } = createProjectSchema.validate(validData);
          expect(error).toBeUndefined();
        });
      });

      it("should reject invalid project_type", () => {
        const invalidData = {
          name: "My Project",
          key: "PROJ",
          project_type: "invalid_type",
        };
        const { error } = createProjectSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should accept valid status values", () => {
        const statuses = ["planned", "active", "on_hold", "completed", "archived"];
        statuses.forEach((status) => {
          const validData = {
            name: "My Project",
            key: "PROJ",
            status: status,
          };
          const { error } = createProjectSchema.validate(validData);
          expect(error).toBeUndefined();
        });
      });
    });
  });

  describe("updateProjectSchema", () => {
    it("should accept partial updates", () => {
      const validData = {
        name: "Updated Project Name",
      };
      const { error } = updateProjectSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should validate name length on update", () => {
      const invalidData = {
        name: "AB",
      };
      const { error } = updateProjectSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("at least 3 characters");
    });

    it("should not require any fields", () => {
      const validData = {};
      const { error } = updateProjectSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should not allow key update", () => {
      const data = {
        key: "NEWKEY",
      };
      const { error } = updateProjectSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe("addMembersSchema", () => {
    it("should accept valid members array", () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const validData = {
        members: [validObjectId],
      };
      const { error } = addMembersSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should accept valid managers array", () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const validData = {
        managers: [validObjectId],
      };
      const { error } = addMembersSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should accept both members and managers", () => {
      const validObjectId1 = new mongoose.Types.ObjectId().toString();
      const validObjectId2 = new mongoose.Types.ObjectId().toString();
      const validData = {
        members: [validObjectId1],
        managers: [validObjectId2],
      };
      const { error } = addMembersSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should reject when neither members nor managers provided", () => {
      const invalidData = {};
      const { error } = addMembersSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it("should reject invalid ObjectId in members", () => {
      const invalidData = {
        members: ["invalid-id"],
      };
      const { error } = addMembersSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});
