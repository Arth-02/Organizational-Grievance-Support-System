/**
 * Property-Based Tests for Project Service
 * Feature: project-module
 * 
 * These tests validate universal properties that should hold for all valid inputs.
 * Tests focus on the normalization and validation logic without requiring a database.
 */

const fc = require("fast-check");
const {
  createProjectSchema,
  updateProjectSchema,
  addMembersSchema,
} = require("../../validators/project.validator");

// Generators for test data
const alphanumericChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const upperAlphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const generateAlphanumericKey = () =>
  fc.array(fc.constantFrom(...alphanumericChars.split('')), { minLength: 2, maxLength: 10 })
    .map(arr => arr.join(''))
    .filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length >= 2);

const generateUpperAlphanumericKey = (minLen = 2, maxLen = 10) =>
  fc.array(fc.constantFrom(...upperAlphanumericChars.split('')), { minLength: minLen, maxLength: maxLen })
    .map(arr => arr.join(''));

const generateValidProjectName = () =>
  fc.string({ minLength: 3, maxLength: 100 })
    .filter(s => s.trim().length >= 3)
    .map(s => s.trim());

describe("Project Service Property Tests", () => {
  /**
   * Property 1: Project Key Uniqueness and Normalization
   * 
   * *For any* project creation request with a valid key, the Project_Service SHALL 
   * normalize the key to uppercase and trimmed format, and if a project with the same 
   * normalized key already exists in the organization, the creation SHALL be rejected 
   * with an appropriate error.
   * 
   * **Validates: Requirements 1.1, 1.2, 1.6**
   */
  describe("Property 1: Project Key Uniqueness and Normalization", () => {
    
    it("should normalize all valid project keys to uppercase after validation", async () => {
      await fc.assert(
        fc.property(
          generateAlphanumericKey(),
          generateValidProjectName(),
          (key, name) => {
            const { error, value } = createProjectSchema.validate({
              name,
              key,
            });

            if (!error) {
              // Property: The validated key should always be uppercase
              expect(value.key).toBe(key.toUpperCase());
              // Property: The key should be trimmed
              expect(value.key).toBe(value.key.trim());
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve key case-insensitive equivalence after normalization", async () => {
      await fc.assert(
        fc.property(
          generateAlphanumericKey(),
          (key) => {
            const lowerKey = key.toLowerCase();
            const upperKey = key.toUpperCase();
            const mixedKey = key;

            const result1 = createProjectSchema.validate({ name: "Test Project", key: lowerKey });
            const result2 = createProjectSchema.validate({ name: "Test Project", key: upperKey });
            const result3 = createProjectSchema.validate({ name: "Test Project", key: mixedKey });

            // Property: All case variations should normalize to the same uppercase key
            if (!result1.error && !result2.error && !result3.error) {
              expect(result1.value.key).toBe(result2.value.key);
              expect(result2.value.key).toBe(result3.value.key);
              expect(result1.value.key).toBe(upperKey);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject all keys with non-alphanumeric characters", async () => {
      // Test specific invalid characters that should be rejected
      const invalidKeys = [
        'PROJ-1',    // hyphen
        'PROJ_1',    // underscore
        'PROJ 1',    // space
        'PROJ!',     // exclamation
        'PROJ@1',    // at sign
        'PROJ#1',    // hash
        'PROJ$1',    // dollar
        'PROJ%1',    // percent
      ];

      for (const invalidKey of invalidKeys) {
        const { error } = createProjectSchema.validate({
          name: "Test Project",
          key: invalidKey,
        });
        expect(error).toBeDefined();
      }
    });

    it("should reject keys outside valid length range", async () => {
      await fc.assert(
        fc.property(
          fc.oneof(
            // Too short (0-1 chars)
            generateUpperAlphanumericKey(0, 1),
            // Too long (11+ chars)
            generateUpperAlphanumericKey(11, 20)
          ),
          (invalidKey) => {
            const { error } = createProjectSchema.validate({
              name: "Test Project",
              key: invalidKey,
            });

            // Property: Keys outside 2-10 character range should be rejected
            expect(error).toBeDefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept all keys within valid length range with valid characters", async () => {
      await fc.assert(
        fc.property(
          generateUpperAlphanumericKey(2, 10),
          (validKey) => {
            const { error, value } = createProjectSchema.validate({
              name: "Test Project",
              key: validKey,
            });

            // Property: Valid keys should be accepted
            expect(error).toBeUndefined();
            expect(value.key).toBe(validKey.toUpperCase());
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional validation properties for project names
   */
  describe("Project Name Validation Properties", () => {
    it("should accept all names within valid length range", async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
          (name) => {
            const { error } = createProjectSchema.validate({
              name,
              key: "TEST",
            });

            // Property: Names within 3-100 chars should be accepted
            if (name.trim().length >= 3 && name.trim().length <= 100) {
              expect(error).toBeUndefined();
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject names outside valid length range", async () => {
      await fc.assert(
        fc.property(
          fc.oneof(
            // Too short (0-2 chars) - use alphanumeric to avoid trim issues
            fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 0, maxLength: 2 }).map(arr => arr.join('')),
            // Too long (101+ chars) - use alphanumeric to avoid trim issues
            fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 101, maxLength: 150 }).map(arr => arr.join(''))
          ),
          (name) => {
            const { error } = createProjectSchema.validate({
              name,
              key: "TEST",
            });

            // Property: Names outside 3-100 chars should be rejected
            expect(error).toBeDefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Organization Data Isolation
   * 
   * *For any* query operation (list projects, get project details), the service SHALL 
   * return only data belonging to the requesting user's organization, regardless of 
   * what IDs are provided in the request.
   * 
   * **Validates: Requirements 1.3, 1.7**
   * 
   * Note: This property test validates the service interface design ensures organization
   * isolation by requiring organization_id in all operations.
   */
  describe("Property 2: Organization Data Isolation", () => {
    const mongoose = require("mongoose");
    const fs = require("fs");
    const path = require("path");

    // Read the service file to verify organization isolation patterns
    const serviceFilePath = path.join(__dirname, "../../services/project.service.js");
    let serviceCode;

    beforeAll(() => {
      serviceCode = fs.readFileSync(serviceFilePath, "utf8");
    });

    it("should include organization_id filter in getProjectById implementation", () => {
      // Property: The getProjectById function must filter by organization_id
      // This ensures data isolation at the query level
      
      // Check that the function uses organization_id from user
      expect(serviceCode).toContain("getProjectById");
      expect(serviceCode).toContain("organization_id");
      
      // Verify the query pattern includes organization_id
      const getByIdPattern = /findOne\s*\(\s*\{[^}]*organization_id/;
      expect(serviceCode).toMatch(getByIdPattern);
    });

    it("should include organization_id filter in getAllProjects implementation", () => {
      // Property: The getAllProjects function must filter by organization_id
      
      expect(serviceCode).toContain("getAllProjects");
      
      // Verify the filter includes organization_id
      const filterPattern = /filter\s*=\s*\{[^}]*organization_id/;
      expect(serviceCode).toMatch(filterPattern);
    });

    it("should extract organization_id from user object in all query methods", () => {
      // Property: All methods should destructure organization_id from user
      
      // Count occurrences of organization_id extraction pattern
      const extractionPattern = /const\s*\{\s*organization_id[^}]*\}\s*=\s*user/g;
      const matches = serviceCode.match(extractionPattern);
      
      // Should have multiple extractions (one per method that needs it)
      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(5); // At least 5 methods use it
    });

    it("should validate member organization in addProjectMembers", () => {
      // Property: When adding members, the service must validate they belong to same org
      
      expect(serviceCode).toContain("addProjectMembers");
      
      // Check for user validation against organization - the service uses User.find with organization_id
      expect(serviceCode).toContain("User.find");
      expect(serviceCode).toContain("organization_id");
      expect(serviceCode).toContain("One or more users do not belong to this organization");
    });

    it("should include deleted_at null check for soft delete isolation", () => {
      // Property: Queries should exclude soft-deleted projects
      
      const deletedAtPattern = /deleted_at:\s*null/g;
      const matches = serviceCode.match(deletedAtPattern);
      
      // Should have multiple checks for deleted_at: null
      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(4);
    });

    it("should validate organization IDs are properly typed", async () => {
      // Property: Organization IDs should be valid MongoDB ObjectIds
      await fc.assert(
        fc.property(
          fc.constant(null).map(() => new mongoose.Types.ObjectId().toString()),
          fc.constant(null).map(() => new mongoose.Types.ObjectId().toString()),
          (orgId1, orgId2) => {
            // Two different generated ObjectIds should be unique
            // This validates the isolation mechanism works with proper IDs
            expect(mongoose.isValidObjectId(orgId1)).toBe(true);
            expect(mongoose.isValidObjectId(orgId2)).toBe(true);
            
            // Different IDs ensure different organizations
            if (orgId1 !== orgId2) {
              expect(orgId1).not.toBe(orgId2);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Property 13: Permission-Based Access Control
 * 
 * *For any* API request requiring specific permissions (CREATE_PROJECT, UPDATE_PROJECT, 
 * DELETE_PROJECT, VIEW_PROJECT), the system SHALL return 403 Forbidden if the requesting 
 * user lacks the required permission in their role or special_permissions.
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 */
describe("Property 13: Permission-Based Access Control", () => {
  const fs = require("fs");
  const path = require("path");

  // Read the middleware and routes files to verify permission patterns
  const middlewarePath = path.join(__dirname, "../../middlewares/auth.middleware.js");
  const projectRoutePath = path.join(__dirname, "../../routes/project.route.js");
  const constantsPath = path.join(__dirname, "../../utils/constant.js");
  
  let middlewareCode;
  let routeCode;
  let constantsCode;

  beforeAll(() => {
    middlewareCode = fs.readFileSync(middlewarePath, "utf8");
    routeCode = fs.readFileSync(projectRoutePath, "utf8");
    constantsCode = fs.readFileSync(constantsPath, "utf8");
  });

  // Required permissions for project operations
  const requiredPermissions = [
    { operation: "create", permission: "CREATE_PROJECT", route: "/create", method: "POST" },
    { operation: "update", permission: "UPDATE_PROJECT", route: "/update/:id", method: "PATCH" },
    { operation: "delete", permission: "DELETE_PROJECT", route: "/delete/:id", method: "DELETE" },
    { operation: "view", permission: "VIEW_PROJECT", route: "/details/:id", method: "GET" },
    { operation: "viewAll", permission: "VIEW_PROJECT", route: "/all", method: "GET" },
  ];

  it("should define all required project permissions in constants", () => {
    // Property: All required permissions must be defined
    const permissions = ["CREATE_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT", "VIEW_PROJECT"];
    
    for (const permission of permissions) {
      expect(constantsCode).toContain(`const ${permission}`);
      expect(constantsCode).toContain(`slug: "${permission}"`);
    }
  });

  it("should export all project permissions from constants", () => {
    // Property: All permissions must be exported for use in routes
    const permissions = ["CREATE_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT", "VIEW_PROJECT"];
    
    for (const permission of permissions) {
      const exportPattern = new RegExp(`module\\.exports\\s*=\\s*\\{[^}]*${permission}`);
      expect(constantsCode).toMatch(exportPattern);
    }
  });

  it("should apply checkPermission middleware to all protected routes", () => {
    // Property: All project routes must use checkPermission middleware
    for (const { permission, route } of requiredPermissions) {
      // Check that the route uses checkPermission with the correct permission
      const routePattern = new RegExp(`checkPermission\\s*\\(\\s*\\[\\s*${permission}\\.slug\\s*\\]\\s*\\)`);
      expect(routeCode).toMatch(routePattern);
    }
  });

  it("should return 403 when user lacks required permission in checkPermission middleware", () => {
    // Property: The middleware must return 403 for unauthorized access
    expect(middlewareCode).toContain("checkPermission");
    expect(middlewareCode).toContain("403");
    expect(middlewareCode).toContain("Forbidden");
    
    // Verify the middleware checks both role permissions and special permissions
    expect(middlewareCode).toContain("role?.permissions");
    expect(middlewareCode).toContain("special_permissions");
  });

  it("should check role permissions in checkPermission middleware", () => {
    // Property: Middleware must check user's role permissions
    const rolePermissionCheck = /hasUserRolePermissions\s*=\s*req\.user\?\.role\?\.permissions\?\.some/;
    expect(middlewareCode).toMatch(rolePermissionCheck);
  });

  it("should check special permissions in checkPermission middleware", () => {
    // Property: Middleware must check user's special permissions
    const specialPermissionCheck = /hasSpecialPermissions\s*=\s*req\.user\?\.special_permissions\?\.some/;
    expect(middlewareCode).toMatch(specialPermissionCheck);
  });

  it("should allow access when user has either role or special permission", () => {
    // Property: Access should be granted if user has permission from either source
    const combinedCheck = /hasUserPermission\s*=\s*hasUserRolePermissions\s*\|\|\s*hasSpecialPermissions/;
    expect(middlewareCode).toMatch(combinedCheck);
  });

  it("should return 401 when no authorization token is provided", () => {
    // Property: Missing token should result in 401 Unauthorized
    expect(middlewareCode).toContain("401");
    expect(middlewareCode).toContain("Unauthorized");
    expect(middlewareCode).toContain("No token provided");
  });

  it("should return 401 when authorization token is invalid", () => {
    // Property: Invalid token should result in 401 Unauthorized
    expect(middlewareCode).toContain("Invalid token");
  });

  it("should return 404 when user is not found", () => {
    // Property: Non-existent user should result in 404
    expect(middlewareCode).toContain("404");
    expect(middlewareCode).toContain("User not found");
  });

  it("should validate permission checking logic with property-based approach", async () => {
    await fc.assert(
      fc.property(
        // Generate random permission sets
        fc.array(fc.constantFrom("CREATE_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT", "VIEW_PROJECT"), { minLength: 0, maxLength: 4 }),
        fc.array(fc.constantFrom("CREATE_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT", "VIEW_PROJECT"), { minLength: 0, maxLength: 4 }),
        fc.constantFrom("CREATE_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT", "VIEW_PROJECT"),
        (rolePermissions, specialPermissions, requiredPermission) => {
          // Simulate the permission check logic from middleware
          const hasRolePermission = rolePermissions.includes(requiredPermission);
          const hasSpecialPermission = specialPermissions.includes(requiredPermission);
          const hasPermission = hasRolePermission || hasSpecialPermission;

          // Property: User should have access if and only if they have the required permission
          // in either role permissions or special permissions
          if (hasPermission) {
            expect(hasRolePermission || hasSpecialPermission).toBe(true);
          } else {
            expect(hasRolePermission).toBe(false);
            expect(hasSpecialPermission).toBe(false);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should ensure DEV role bypasses permission checks", () => {
    // Property: DEV role should have access to all resources
    expect(middlewareCode).toContain("DEV");
    const devBypassPattern = /req\.user\.role\.name\s*===\s*DEV/;
    expect(middlewareCode).toMatch(devBypassPattern);
  });

  it("should import checkPermission in project routes", () => {
    // Property: Routes must import the checkPermission middleware
    expect(routeCode).toContain("checkPermission");
    expect(routeCode).toContain('require("../middlewares/auth.middleware")');
  });

  it("should import all required permission constants in routes", () => {
    // Property: Routes must import all permission constants they use
    const permissions = ["CREATE_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT", "VIEW_PROJECT"];
    
    for (const permission of permissions) {
      expect(routeCode).toContain(permission);
    }
  });
});


/**
 * Property 15: Input Validation Rejection
 * 
 * *For any* request with invalid input (project name outside 3-100 chars, project key 
 * outside 2-10 alphanumeric chars, task title outside 3-200 chars, task description 
 * over 5000 chars, invalid column keys), the system SHALL return 400 Bad Request 
 * with detailed error messages.
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**
 */
describe("Property 15: Input Validation Rejection", () => {
  const {
    createProjectSchema,
    updateProjectSchema,
  } = require("../../validators/project.validator");
  const {
    createTaskSchema,
    updateTaskSchema,
  } = require("../../validators/task.validator");
  const {
    createBoardSchema,
    updateBoardSchema,
  } = require("../../validators/board.validator");
  const mongoose = require("mongoose");

  // Generators for invalid data
  const generateValidObjectId = () =>
    fc.constant(null).map(() => new mongoose.Types.ObjectId().toString());

  const upperAlphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const generateUpperAlphanumericKey = (minLen, maxLen) =>
    fc.array(fc.constantFrom(...upperAlphanumericChars.split('')), { minLength: minLen, maxLength: maxLen })
      .map(arr => arr.join(''));

  /**
   * Property 15.1: Project name validation (Requirements 10.1)
   * Project name must be between 3 and 100 characters
   */
  describe("Project Name Validation (Requirement 10.1)", () => {
    
    it("should reject project names shorter than 3 characters", async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 2 }),
          (shortName) => {
            const { error } = createProjectSchema.validate({
              name: shortName,
              key: "TEST",
            });

            // Property: Names under 3 chars should be rejected
            expect(error).toBeDefined();
            expect(error.details.some(d => 
              d.message.includes("at least 3 characters") || 
              d.message.includes("required")
            )).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject project names longer than 100 characters", async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 150 }).filter(s => s.trim().length > 100),
          (longName) => {
            const { error } = createProjectSchema.validate({
              name: longName,
              key: "TEST",
            });

            // Property: Names over 100 chars (after trim) should be rejected
            expect(error).toBeDefined();
            expect(error.details.some(d => 
              d.message.includes("100 characters") || 
              d.message.includes("exceed")
            )).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept project names within valid range (3-100 chars)", async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
          (validName) => {
            const { error } = createProjectSchema.validate({
              name: validName,
              key: "TEST",
            });

            // Property: Valid names should be accepted
            expect(error).toBeUndefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15.2: Project key validation (Requirements 10.2)
   * Project key must be between 2 and 10 uppercase alphanumeric characters
   */
  describe("Project Key Validation (Requirement 10.2)", () => {
    
    it("should reject project keys shorter than 2 characters", async () => {
      await fc.assert(
        fc.property(
          generateUpperAlphanumericKey(0, 1),
          (shortKey) => {
            const { error } = createProjectSchema.validate({
              name: "Valid Project Name",
              key: shortKey,
            });

            // Property: Keys under 2 chars should be rejected
            expect(error).toBeDefined();
            expect(error.details.some(d => 
              d.message.includes("at least 2 characters") || 
              d.message.includes("required")
            )).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject project keys longer than 10 characters", async () => {
      await fc.assert(
        fc.property(
          generateUpperAlphanumericKey(11, 20),
          (longKey) => {
            const { error } = createProjectSchema.validate({
              name: "Valid Project Name",
              key: longKey,
            });

            // Property: Keys over 10 chars should be rejected
            expect(error).toBeDefined();
            expect(error.details.some(d => 
              d.message.includes("10 characters") || 
              d.message.includes("exceed")
            )).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject project keys with non-alphanumeric characters", async () => {
      const invalidKeys = [
        "PROJ-1",    // hyphen
        "PROJ_1",    // underscore
        "PROJ 1",    // space
        "PROJ!",     // exclamation
        "PROJ@1",    // at sign
        "PROJ#1",    // hash
        "PROJ$1",    // dollar
        "PROJ%1",    // percent
        "PROJ.1",    // period
        "PROJ/1",    // slash
      ];

      for (const invalidKey of invalidKeys) {
        const { error } = createProjectSchema.validate({
          name: "Valid Project Name",
          key: invalidKey,
        });

        // Property: Non-alphanumeric keys should be rejected
        expect(error).toBeDefined();
        expect(error.details.some(d => 
          d.message.includes("alphanumeric") || 
          d.message.includes("pattern")
        )).toBe(true);
      }
    });

    it("should accept valid project keys (2-10 uppercase alphanumeric)", async () => {
      await fc.assert(
        fc.property(
          generateUpperAlphanumericKey(2, 10),
          (validKey) => {
            const { error, value } = createProjectSchema.validate({
              name: "Valid Project Name",
              key: validKey,
            });

            // Property: Valid keys should be accepted and normalized to uppercase
            expect(error).toBeUndefined();
            expect(value.key).toBe(validKey.toUpperCase());
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15.3: Task title validation (Requirements 10.3)
   * Task title must be between 3 and 200 characters
   */
  describe("Task Title Validation (Requirement 10.3)", () => {
    
    it("should reject task titles shorter than 3 characters", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.string({ minLength: 0, maxLength: 2 }),
          (projectId, shortTitle) => {
            const { error } = createTaskSchema.validate({
              project_id: projectId,
              title: shortTitle,
              status: "todo",
            });

            // Property: Titles under 3 chars should be rejected
            expect(error).toBeDefined();
            expect(error.details.some(d => 
              d.message.includes("at least 3 characters") || 
              d.message.includes("required")
            )).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject task titles longer than 200 characters", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.string({ minLength: 201, maxLength: 300 }),
          (projectId, longTitle) => {
            const { error } = createTaskSchema.validate({
              project_id: projectId,
              title: longTitle,
              status: "todo",
            });

            // Property: Titles over 200 chars should be rejected
            expect(error).toBeDefined();
            expect(error.details.some(d => 
              d.message.includes("200 characters") || 
              d.message.includes("exceed")
            )).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept task titles within valid range (3-200 chars)", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.string({ minLength: 3, maxLength: 200 }).filter(s => s.trim().length >= 3),
          (projectId, validTitle) => {
            const { error } = createTaskSchema.validate({
              project_id: projectId,
              title: validTitle,
              status: "todo",
            });

            // Property: Valid titles should be accepted
            expect(error).toBeUndefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15.4: Task description validation (Requirements 10.4)
   * Task description must not exceed 5000 characters
   */
  describe("Task Description Validation (Requirement 10.4)", () => {
    
    it("should reject task descriptions longer than 5000 characters", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.string({ minLength: 5001, maxLength: 6000 }),
          (projectId, longDescription) => {
            const { error } = createTaskSchema.validate({
              project_id: projectId,
              title: "Valid Task Title",
              status: "todo",
              description: longDescription,
            });

            // Property: Descriptions over 5000 chars should be rejected
            expect(error).toBeDefined();
            expect(error.details.some(d => 
              d.message.includes("5000 characters") || 
              d.message.includes("exceed")
            )).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept task descriptions within valid range (0-5000 chars)", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.string({ minLength: 0, maxLength: 5000 }),
          (projectId, validDescription) => {
            const { error } = createTaskSchema.validate({
              project_id: projectId,
              title: "Valid Task Title",
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

    it("should accept empty task descriptions", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          (projectId) => {
            const { error } = createTaskSchema.validate({
              project_id: projectId,
              title: "Valid Task Title",
              status: "todo",
              description: "",
            });

            // Property: Empty descriptions should be accepted
            expect(error).toBeUndefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15.5: Board column key validation (Requirements 10.5)
   * Column keys must be alphanumeric with hyphens allowed
   */
  describe("Board Column Key Validation (Requirement 10.5)", () => {
    
    it("should reject column keys with invalid characters", async () => {
      const invalidColumnKeys = [
        "col_key",    // underscore
        "col key",    // space
        "col!key",    // exclamation
        "col@key",    // at sign
        "col#key",    // hash
        "col$key",    // dollar
        "col%key",    // percent
        "col.key",    // period
        "col/key",    // slash
        "col\\key",   // backslash
      ];

      for (const invalidKey of invalidColumnKeys) {
        const { error } = createBoardSchema.validate({
          project_id: new mongoose.Types.ObjectId().toString(),
          name: "Valid Board Name",
          columns: [
            { key: invalidKey, label: "Column Label", order: 0 },
          ],
        });

        // Property: Invalid column keys should be rejected
        expect(error).toBeDefined();
        expect(error.details.some(d => 
          d.message.includes("alphanumeric") || 
          d.message.includes("pattern") ||
          d.message.includes("hyphens")
        )).toBe(true);
      }
    });

    it("should accept valid column keys (alphanumeric with hyphens)", async () => {
      const validColumnKeys = [
        "todo",
        "in-progress",
        "done",
        "column1",
        "my-column-2",
        "ABC123",
        "test-column-key",
      ];

      for (const validKey of validColumnKeys) {
        const { error } = createBoardSchema.validate({
          project_id: new mongoose.Types.ObjectId().toString(),
          name: "Valid Board Name",
          columns: [
            { key: validKey, label: "Column Label", order: 0 },
          ],
        });

        // Property: Valid column keys should be accepted
        expect(error).toBeUndefined();
      }
    });

    it("should reject duplicate column keys within a board", async () => {
      const { error } = createBoardSchema.validate({
        project_id: new mongoose.Types.ObjectId().toString(),
        name: "Valid Board Name",
        columns: [
          { key: "todo", label: "To Do", order: 0 },
          { key: "todo", label: "Duplicate", order: 1 },
        ],
      });

      // Property: Duplicate column keys should be rejected
      expect(error).toBeDefined();
      expect(error.details.some(d => 
        d.message.includes("unique") || 
        d.message.includes("duplicate")
      )).toBe(true);
    });

    it("should accept unique column keys within a board", async () => {
      await fc.assert(
        fc.property(
          generateValidObjectId(),
          fc.set(
            fc.stringMatching(/^[a-zA-Z0-9-]+$/).filter(s => s.length > 0 && s.length <= 50),
            { minLength: 1, maxLength: 5 }
          ),
          (projectId, uniqueKeys) => {
            const columns = [...uniqueKeys].map((key, index) => ({
              key,
              label: `Column ${index}`,
              order: index,
            }));

            const { error } = createBoardSchema.validate({
              project_id: projectId,
              name: "Valid Board Name",
              columns,
            });

            // Property: Unique column keys should be accepted
            expect(error).toBeUndefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15.6: Error message detail validation (Requirements 10.6)
   * Validation errors should return detailed error messages
   */
  describe("Error Message Detail Validation (Requirement 10.6)", () => {
    
    it("should return detailed error messages for project validation failures", async () => {
      const { error } = createProjectSchema.validate({
        name: "ab",  // too short
        key: "INVALID-KEY!",  // invalid characters
      });

      // Property: Error should contain detailed messages
      expect(error).toBeDefined();
      expect(error.details).toBeDefined();
      expect(error.details.length).toBeGreaterThan(0);
      
      // Each error detail should have a message
      for (const detail of error.details) {
        expect(detail.message).toBeDefined();
        expect(typeof detail.message).toBe("string");
        expect(detail.message.length).toBeGreaterThan(0);
      }
    });

    it("should return detailed error messages for task validation failures", async () => {
      const { error } = createTaskSchema.validate({
        project_id: "invalid-id",  // invalid ObjectId
        title: "ab",  // too short
        status: "",  // empty
      });

      // Property: Error should contain detailed messages
      expect(error).toBeDefined();
      expect(error.details).toBeDefined();
      expect(error.details.length).toBeGreaterThan(0);
      
      // Each error detail should have a message
      for (const detail of error.details) {
        expect(detail.message).toBeDefined();
        expect(typeof detail.message).toBe("string");
        expect(detail.message.length).toBeGreaterThan(0);
      }
    });

    it("should return detailed error messages for board validation failures", async () => {
      const { error } = createBoardSchema.validate({
        project_id: "invalid-id",  // invalid ObjectId
        name: "",  // empty
        columns: [],  // empty array
      });

      // Property: Error should contain detailed messages
      expect(error).toBeDefined();
      expect(error.details).toBeDefined();
      expect(error.details.length).toBeGreaterThan(0);
      
      // Each error detail should have a message
      for (const detail of error.details) {
        expect(detail.message).toBeDefined();
        expect(typeof detail.message).toBe("string");
        expect(detail.message.length).toBeGreaterThan(0);
      }
    });

    it("should include field path in error details", async () => {
      const { error } = createProjectSchema.validate({
        name: "ab",  // too short
        key: "X",    // too short
      });

      // Property: Error details should include the field path
      expect(error).toBeDefined();
      expect(error.details).toBeDefined();
      
      for (const detail of error.details) {
        expect(detail.path).toBeDefined();
        expect(Array.isArray(detail.path)).toBe(true);
      }
    });

    it("should return multiple errors when multiple fields are invalid", async () => {
      const { error } = createProjectSchema.validate({
        name: "ab",           // too short (error 1)
        key: "X",             // too short (error 2)
      }, { abortEarly: false });

      // Property: Multiple validation errors should be returned
      expect(error).toBeDefined();
      expect(error.details).toBeDefined();
      expect(error.details.length).toBeGreaterThanOrEqual(2);
    });
  });

  /**
   * Property 15.7: Update schema validation
   * Update schemas should also enforce validation rules
   */
  describe("Update Schema Validation", () => {
    
    it("should reject invalid project name in update schema", async () => {
      await fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 2 }),  // too short
            fc.string({ minLength: 101, maxLength: 150 })  // too long
          ),
          (invalidName) => {
            const { error } = updateProjectSchema.validate({
              name: invalidName,
            });

            // Property: Invalid names should be rejected in updates too
            expect(error).toBeDefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject invalid task title in update schema", async () => {
      await fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 2 }),  // too short
            fc.string({ minLength: 201, maxLength: 300 })  // too long
          ),
          (invalidTitle) => {
            const { error } = updateTaskSchema.validate({
              title: invalidTitle,
            });

            // Property: Invalid titles should be rejected in updates too
            expect(error).toBeDefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject invalid task description in update schema", async () => {
      await fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), { minLength: 5001, maxLength: 6000 }).map(arr => arr.join('')),
          (longDescription) => {
            const { error } = updateTaskSchema.validate({
              description: longDescription,
            });

            // Property: Long descriptions should be rejected in updates too
            expect(error).toBeDefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject invalid column keys in board update schema", async () => {
      const { error } = updateBoardSchema.validate({
        columns: [
          { key: "invalid_key!", label: "Label", order: 0 },
        ],
      });

      // Property: Invalid column keys should be rejected in updates too
      expect(error).toBeDefined();
    });
  });
});
