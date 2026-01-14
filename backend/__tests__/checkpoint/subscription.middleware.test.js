/**
 * Checkpoint Tests for Subscription Access Control Middleware
 * 
 * These tests verify that the access control middleware correctly:
 * 1. Enforces limits for each resource type (users, projects, storage)
 * 2. Enforces feature access restrictions
 * 3. Handles expired subscription behavior (read-only mode)
 * 
 * @requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

const {
  checkSubscriptionLimit,
  requireFeature,
  enforceSubscriptionAccess,
  subscriptionCache,
  AccessErrorCodes,
  getMinimumPlanForFeature,
  clearSubscriptionCache,
} = require('../../middlewares/subscription.middleware');

// Mock the subscription service
jest.mock('../../services/subscription.service', () => ({
  subscriptionService: {
    getActiveSubscription: jest.fn(),
  },
}));

// Mock the usage tracker service
jest.mock('../../services/usageTracker.service', () => ({
  UsageTracker: {
    getUsage: jest.fn(),
  },
}));

const { subscriptionService } = require('../../services/subscription.service');
const { UsageTracker } = require('../../services/usageTracker.service');

describe('Subscription Access Control Middleware - Checkpoint Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Clear cache before each test
    clearSubscriptionCache();
    
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock request
    mockReq = {
      user: {
        organization_id: '507f1f77bcf86cd799439011',
      },
      method: 'POST',
    };

    // Setup mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup mock next function
    mockNext = jest.fn();
  });

  // Helper to create mock subscription data
  const createMockSubscription = (overrides = {}) => ({
    subscriptionId: '507f1f77bcf86cd799439012',
    organizationId: '507f1f77bcf86cd799439011',
    plan: {
      id: '507f1f77bcf86cd799439013',
      name: 'starter',
      displayName: 'Starter',
      limits: {
        maxUsers: 10,
        maxProjects: 3,
        maxStorageBytes: 1073741824, // 1GB
      },
      features: ['basic_grievance'],
    },
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    ...overrides,
  });

  // ==================== Limit Enforcement Tests ====================
  describe('Limit Enforcement - checkSubscriptionLimit', () => {
    
    describe('User Limit Enforcement (Requirement 6.1)', () => {
      it('should allow user creation when under limit', async () => {
        const mockSubscription = createMockSubscription();
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });
        UsageTracker.getUsage.mockResolvedValue({
          userCount: 5,
          projectCount: 1,
          storageBytes: 0,
        });

        const middleware = checkSubscriptionLimit('users');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should block user creation when at limit', async () => {
        const mockSubscription = createMockSubscription();
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });
        UsageTracker.getUsage.mockResolvedValue({
          userCount: 10, // At limit
          projectCount: 1,
          storageBytes: 0,
        });

        const middleware = checkSubscriptionLimit('users');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: AccessErrorCodes.USER_LIMIT_REACHED,
            currentUsage: 10,
            limit: 10,
            upgradeUrl: '/settings/subscription',
          })
        );
      });

      it('should allow unlimited users for enterprise plan', async () => {
        const mockSubscription = createMockSubscription({
          plan: {
            name: 'enterprise',
            displayName: 'Enterprise',
            limits: { maxUsers: -1, maxProjects: -1, maxStorageBytes: -1 },
            features: ['basic_grievance', 'audit_logs', 'sso'],
          },
        });
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });
        UsageTracker.getUsage.mockResolvedValue({
          userCount: 1000,
          projectCount: 500,
          storageBytes: 0,
        });

        const middleware = checkSubscriptionLimit('users');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });

    describe('Project Limit Enforcement (Requirement 6.2)', () => {
      it('should allow project creation when under limit', async () => {
        const mockSubscription = createMockSubscription();
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });
        UsageTracker.getUsage.mockResolvedValue({
          userCount: 5,
          projectCount: 1,
          storageBytes: 0,
        });

        const middleware = checkSubscriptionLimit('projects');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should block project creation when at limit', async () => {
        const mockSubscription = createMockSubscription();
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });
        UsageTracker.getUsage.mockResolvedValue({
          userCount: 5,
          projectCount: 3, // At limit
          storageBytes: 0,
        });

        const middleware = checkSubscriptionLimit('projects');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: AccessErrorCodes.PROJECT_LIMIT_REACHED,
            currentUsage: 3,
            limit: 3,
          })
        );
      });
    });

    describe('Storage Limit Enforcement (Requirement 6.3)', () => {
      it('should allow upload when under storage limit', async () => {
        const mockSubscription = createMockSubscription();
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });
        UsageTracker.getUsage.mockResolvedValue({
          userCount: 5,
          projectCount: 1,
          storageBytes: 500000000, // 500MB
        });

        mockReq.file = { size: 1000000 }; // 1MB upload

        const middleware = checkSubscriptionLimit('storage');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should block upload when would exceed storage limit', async () => {
        const mockSubscription = createMockSubscription();
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });
        UsageTracker.getUsage.mockResolvedValue({
          userCount: 5,
          projectCount: 1,
          storageBytes: 1073741824, // 1GB - at limit
        });

        mockReq.file = { size: 1000000 }; // 1MB upload would exceed

        const middleware = checkSubscriptionLimit('storage');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: AccessErrorCodes.STORAGE_LIMIT_REACHED,
          })
        );
      });
    });

    describe('Error Response Format (Requirement 6.6)', () => {
      it('should return 403 with structured error response including limit info', async () => {
        const mockSubscription = createMockSubscription();
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });
        UsageTracker.getUsage.mockResolvedValue({
          userCount: 10,
          projectCount: 1,
          storageBytes: 0,
        });

        const middleware = checkSubscriptionLimit('users');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        const responseBody = mockRes.json.mock.calls[0][0];
        
        // Verify structured error response
        expect(responseBody).toHaveProperty('error');
        expect(responseBody).toHaveProperty('code');
        expect(responseBody).toHaveProperty('currentUsage');
        expect(responseBody).toHaveProperty('limit');
        expect(responseBody).toHaveProperty('upgradeUrl');
        expect(responseBody).toHaveProperty('planName');
        expect(responseBody).toHaveProperty('planDisplayName');
      });
    });
  });

  // ==================== Feature Access Tests ====================
  describe('Feature Access Enforcement - requireFeature', () => {
    
    describe('Audit Logs Feature (Requirement 6.4)', () => {
      it('should allow access to audit logs for Professional plan', async () => {
        const mockSubscription = createMockSubscription({
          plan: {
            name: 'professional',
            displayName: 'Professional',
            limits: { maxUsers: 50, maxProjects: -1, maxStorageBytes: 10737418240 },
            features: ['basic_grievance', 'advanced_permissions', 'audit_logs', 'api_access'],
          },
        });
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });

        const middleware = requireFeature('audit_logs');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should block access to audit logs for Starter plan', async () => {
        const mockSubscription = createMockSubscription(); // Starter plan
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });

        const middleware = requireFeature('audit_logs');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: AccessErrorCodes.FEATURE_NOT_AVAILABLE,
            feature: 'audit_logs',
            requiredPlan: 'professional',
          })
        );
      });
    });

    describe('API Access Feature (Requirement 6.5)', () => {
      it('should allow API access for Professional plan', async () => {
        const mockSubscription = createMockSubscription({
          plan: {
            name: 'professional',
            displayName: 'Professional',
            limits: { maxUsers: 50, maxProjects: -1, maxStorageBytes: 10737418240 },
            features: ['basic_grievance', 'advanced_permissions', 'audit_logs', 'api_access'],
          },
        });
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });

        const middleware = requireFeature('api_access');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should block API access for Starter plan', async () => {
        const mockSubscription = createMockSubscription();
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });

        const middleware = requireFeature('api_access');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: AccessErrorCodes.FEATURE_NOT_AVAILABLE,
            feature: 'api_access',
          })
        );
      });
    });

    describe('SSO Feature (Enterprise only)', () => {
      it('should allow SSO for Enterprise plan', async () => {
        const mockSubscription = createMockSubscription({
          plan: {
            name: 'enterprise',
            displayName: 'Enterprise',
            limits: { maxUsers: -1, maxProjects: -1, maxStorageBytes: -1 },
            features: ['basic_grievance', 'audit_logs', 'api_access', 'sso', 'custom_integrations'],
          },
        });
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });

        const middleware = requireFeature('sso');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should block SSO for Professional plan', async () => {
        const mockSubscription = createMockSubscription({
          plan: {
            name: 'professional',
            displayName: 'Professional',
            limits: { maxUsers: 50, maxProjects: -1, maxStorageBytes: 10737418240 },
            features: ['basic_grievance', 'audit_logs', 'api_access'],
          },
        });
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });

        const middleware = requireFeature('sso');
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: AccessErrorCodes.FEATURE_NOT_AVAILABLE,
            requiredPlan: 'enterprise',
          })
        );
      });
    });
  });

  // ==================== Expired Subscription Tests ====================
  describe('Expired Subscription Behavior - enforceSubscriptionAccess (Requirement 6.7)', () => {
    
    it('should allow GET requests for expired subscription (read-only mode)', async () => {
      const mockSubscription = createMockSubscription({
        status: 'expired',
      });
      subscriptionService.getActiveSubscription.mockResolvedValue({
        isSuccess: true,
        data: mockSubscription,
      });

      mockReq.method = 'GET';

      await enforceSubscriptionAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.subscriptionReadOnly).toBe(true);
    });

    it('should block POST requests for expired subscription', async () => {
      const mockSubscription = createMockSubscription({
        status: 'expired',
      });
      subscriptionService.getActiveSubscription.mockResolvedValue({
        isSuccess: true,
        data: mockSubscription,
      });

      mockReq.method = 'POST';

      await enforceSubscriptionAccess(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AccessErrorCodes.READ_ONLY_MODE,
        })
      );
    });

    it('should block PUT requests for expired subscription', async () => {
      const mockSubscription = createMockSubscription({
        status: 'expired',
      });
      subscriptionService.getActiveSubscription.mockResolvedValue({
        isSuccess: true,
        data: mockSubscription,
      });

      mockReq.method = 'PUT';

      await enforceSubscriptionAccess(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should block DELETE requests for expired subscription', async () => {
      const mockSubscription = createMockSubscription({
        status: 'expired',
      });
      subscriptionService.getActiveSubscription.mockResolvedValue({
        isSuccess: true,
        data: mockSubscription,
      });

      mockReq.method = 'DELETE';

      await enforceSubscriptionAccess(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should allow HEAD requests for expired subscription', async () => {
      const mockSubscription = createMockSubscription({
        status: 'expired',
      });
      subscriptionService.getActiveSubscription.mockResolvedValue({
        isSuccess: true,
        data: mockSubscription,
      });

      mockReq.method = 'HEAD';

      await enforceSubscriptionAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should block write operations for cancelled subscription past period end', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const mockSubscription = createMockSubscription({
        status: 'cancelled',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: pastDate,
      });
      subscriptionService.getActiveSubscription.mockResolvedValue({
        isSuccess: true,
        data: mockSubscription,
      });

      mockReq.method = 'POST';

      await enforceSubscriptionAccess(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AccessErrorCodes.READ_ONLY_MODE,
        })
      );
    });

    it('should allow all operations for active subscription', async () => {
      const mockSubscription = createMockSubscription({
        status: 'active',
      });
      subscriptionService.getActiveSubscription.mockResolvedValue({
        isSuccess: true,
        data: mockSubscription,
      });

      mockReq.method = 'POST';

      await enforceSubscriptionAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.subscriptionReadOnly).toBeUndefined();
    });
  });

  // ==================== Edge Cases and Error Handling ====================
  describe('Edge Cases and Error Handling', () => {
    
    it('should return 401 when user has no organization', async () => {
      mockReq.user = { organization_id: null };

      const middleware = checkSubscriptionLimit('users');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ORGANIZATION_REQUIRED',
        })
      );
    });

    it('should return 403 when no subscription found', async () => {
      subscriptionService.getActiveSubscription.mockResolvedValue({
        isSuccess: false,
        message: 'No subscription found',
      });

      const middleware = checkSubscriptionLimit('users');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: AccessErrorCodes.SUBSCRIPTION_REQUIRED,
        })
      );
    });

    it('should block operations for past_due subscription status', async () => {
      const mockSubscription = createMockSubscription({
        status: 'past_due',
      });
      subscriptionService.getActiveSubscription.mockResolvedValue({
        isSuccess: true,
        data: mockSubscription,
      });

      const middleware = checkSubscriptionLimit('users');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should allow operations for trialing subscription status', async () => {
      const mockSubscription = createMockSubscription({
        status: 'trialing',
      });
      subscriptionService.getActiveSubscription.mockResolvedValue({
        isSuccess: true,
        data: mockSubscription,
      });
      UsageTracker.getUsage.mockResolvedValue({
        userCount: 5,
        projectCount: 1,
        storageBytes: 0,
      });

      const middleware = checkSubscriptionLimit('users');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ==================== Helper Function Tests ====================
  describe('Helper Functions', () => {
    
    describe('getMinimumPlanForFeature', () => {
      it('should return correct minimum plan for each feature', () => {
        expect(getMinimumPlanForFeature('basic_grievance')).toBe('starter');
        expect(getMinimumPlanForFeature('audit_logs')).toBe('professional');
        expect(getMinimumPlanForFeature('api_access')).toBe('professional');
        expect(getMinimumPlanForFeature('sso')).toBe('enterprise');
        expect(getMinimumPlanForFeature('custom_integrations')).toBe('enterprise');
        expect(getMinimumPlanForFeature('unknown_feature')).toBe('enterprise');
      });
    });

    describe('Subscription Cache', () => {
      it('should cache subscription data', async () => {
        const mockSubscription = createMockSubscription();
        subscriptionService.getActiveSubscription.mockResolvedValue({
          isSuccess: true,
          data: mockSubscription,
        });
        UsageTracker.getUsage.mockResolvedValue({
          userCount: 5,
          projectCount: 1,
          storageBytes: 0,
        });

        const middleware = checkSubscriptionLimit('users');
        
        // First call - should fetch from service
        await middleware(mockReq, mockRes, mockNext);
        expect(subscriptionService.getActiveSubscription).toHaveBeenCalledTimes(1);

        // Reset mocks but keep cache
        mockNext.mockClear();
        mockRes.status.mockClear();
        mockRes.json.mockClear();

        // Second call - should use cache
        await middleware(mockReq, mockRes, mockNext);
        expect(subscriptionService.getActiveSubscription).toHaveBeenCalledTimes(1); // Still 1
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });
});
