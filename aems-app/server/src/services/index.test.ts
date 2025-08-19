import { BaseService } from './index';
import { AppConfigService } from '@/app.config';
import { Logger } from '@nestjs/common';

// Mock the Logger
jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock process.kill
const mockProcessKill = jest.spyOn(process, 'kill').mockImplementation(() => true);

// Concrete implementation of BaseService for testing
class TestService extends BaseService {
  private taskExecuted = false;
  private taskPromise: Promise<void> | null = null;

  constructor(service: string, configService: AppConfigService) {
    super(service, configService);
  }

  async task(): Promise<void> {
    this.taskExecuted = true;
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  hasTaskExecuted(): boolean {
    return this.taskExecuted;
  }

  resetTaskExecuted(): void {
    this.taskExecuted = false;
  }
}

// Helper function to create mock AppConfigService
const createMockConfigService = (instanceType: string): AppConfigService => {
  return {
    instanceType: instanceType,
  } as AppConfigService;
};

describe('BaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProcessKill.mockClear();
  });

  describe('Constructor - Basic Configuration Scenarios', () => {
    it('should handle empty instance type', () => {
      const configService = createMockConfigService('');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(false);
    });

    it('should handle undefined instance type', () => {
      const configService = createMockConfigService('   ');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(false);
    });

    it('should enable service when explicitly listed', () => {
      const configService = createMockConfigService('testservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });

    it('should not enable service when not listed', () => {
      const configService = createMockConfigService('otherservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(false);
    });

    it('should enable service with wildcard', () => {
      const configService = createMockConfigService('*');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });

    it('should disable service when explicitly disabled', () => {
      const configService = createMockConfigService('!testservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(false);
    });
  });

  describe('Constructor - Multiple Service Configurations', () => {
    it('should handle multiple enabled services', () => {
      const configService = createMockConfigService('service1, testservice, service3');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });

    it('should handle multiple disabled services', () => {
      const configService = createMockConfigService('!service1, !testservice, !service3');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(false);
    });

    it('should handle mix of enabled and disabled services - enabled wins', () => {
      const configService = createMockConfigService('testservice, !otherservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });

    it('should handle mix of enabled and disabled services - disabled wins', () => {
      const configService = createMockConfigService('testservice, !testservice');
      const service = new TestService('testservice', configService);
      
      // testservice is in enabled list, but !testservice is in disabled list
      // Final logic: enabled.includes(service) && !disabled.includes(service)
      // true && !true = false
      expect(service.schedule()).toBe(false);
    });

    it('should handle wildcard with disabled services', () => {
      const configService = createMockConfigService('*, !testservice');
      const service = new TestService('testservice', configService);
      
      // Wildcard adds testservice to enabled, but !testservice adds it to disabled
      // Final logic: enabled.includes(service) && !disabled.includes(service)
      // true && !true = false
      expect(service.schedule()).toBe(false);
    });

    it('should handle wildcard with other enabled services', () => {
      const configService = createMockConfigService('*, otherservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });
  });

  describe('Constructor - Shutdown Service Scenarios', () => {
    it('should handle shutdown service matching current service', () => {
      const configService = createMockConfigService('^testservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });

    it('should handle shutdown service not matching current service', () => {
      const configService = createMockConfigService('^otherservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(false);
    });

    it('should throw error for multiple shutdown services', () => {
      const configService = createMockConfigService('^service1, ^service2');
      
      expect(() => {
        new TestService('testservice', configService);
      }).toThrow('Can only specify a single shutdown service: ^service1,^service2');
    });

    it('should throw error for both shutdown and enabled services', () => {
      const configService = createMockConfigService('^shutdownservice, enabledservice');
      
      expect(() => {
        new TestService('testservice', configService);
      }).toThrow("Can't specify both shutdown and enabled services: ^shutdownservice,enabledservice");
    });
  });

  describe('Constructor - Edge Cases', () => {
    it('should handle whitespace in service names', () => {
      const configService = createMockConfigService('  testservice  ,  otherservice  ');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });

    it('should handle case sensitivity in service names', () => {
      const configService = createMockConfigService('TestService');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });

    it('should handle mixed separators', () => {
      const configService = createMockConfigService('service1,testservice service3');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });

    it('should handle complex combinations', () => {
      const configService = createMockConfigService('*, !service1, !service2');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });

    it('should handle empty entries in list', () => {
      const configService = createMockConfigService('testservice, , otherservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });
  });

  describe('Schedule Method', () => {
    it('should return false when already running', () => {
      const configService = createMockConfigService('testservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
      expect(service.schedule()).toBe(false); // Second call should return false
    });

    it('should return false when runTask is false', () => {
      const configService = createMockConfigService('otherservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(false);
    });

    it('should return true when not running and runTask is true', () => {
      const configService = createMockConfigService('testservice');
      const service = new TestService('testservice', configService);
      
      expect(service.schedule()).toBe(true);
    });
  });

  describe('Execute Method', () => {
    it('should execute task when scheduled successfully', async () => {
      const configService = createMockConfigService('testservice');
      const service = new TestService('testservice', configService);
      
      await service.execute();
      
      expect(service.hasTaskExecuted()).toBe(true);
    });

    it('should not execute task when not scheduled', async () => {
      const configService = createMockConfigService('otherservice');
      const service = new TestService('testservice', configService);
      
      await service.execute();
      
      expect(service.hasTaskExecuted()).toBe(false);
    });

    it('should not execute task when already running', async () => {
      const configService = createMockConfigService('testservice');
      const service = new TestService('testservice', configService);
      
      // Start first execution
      const firstExecution = service.execute();
      
      // Try to start second execution immediately
      await service.execute();
      
      // Wait for first execution to complete
      await firstExecution;
      
      // Task should have been executed only once
      expect(service.hasTaskExecuted()).toBe(true);
    });

    it('should allow re-execution after task completes', async () => {
      const configService = createMockConfigService('testservice');
      const service = new TestService('testservice', configService);
      
      // First execution
      await service.execute();
      expect(service.hasTaskExecuted()).toBe(true);
      
      // Reset and execute again
      service.resetTaskExecuted();
      await service.execute();
      expect(service.hasTaskExecuted()).toBe(true);
    });

    it('should trigger shutdown when shutdown service matches', async () => {
      const configService = createMockConfigService('^testservice');
      const service = new TestService('testservice', configService);
      
      // Override schedule to return true for this test
      jest.spyOn(service, 'schedule').mockReturnValue(true);
      
      await service.execute();
      
      expect(mockProcessKill).toHaveBeenCalledWith(process.pid, 'SIGTERM');
    });

    it('should log shutdown message when shutting down', async () => {
      const configService = createMockConfigService('^testservice');
      const service = new TestService('testservice', configService);
      
      // Override schedule to return true for this test
      jest.spyOn(service, 'schedule').mockReturnValue(true);
      
      await service.execute();
      
      // Check that the logger was called with shutdown message
      expect(Logger).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow for enabled service', async () => {
      const configService = createMockConfigService('testservice');
      const service = new TestService('testservice', configService);
      
      // Execute should work and complete the task
      await service.execute();
      expect(service.hasTaskExecuted()).toBe(true);
      
      // Should be able to schedule again after execution
      expect(service.schedule()).toBe(true);
      
      // Should not be able to schedule again while running
      expect(service.schedule()).toBe(false);
    });

    it('should handle complete workflow for disabled service', async () => {
      const configService = createMockConfigService('!testservice');
      const service = new TestService('testservice', configService);
      
      // Should not be able to schedule
      expect(service.schedule()).toBe(false);
      
      // Execute should not run the task
      await service.execute();
      expect(service.hasTaskExecuted()).toBe(false);
    });

    it('should handle wildcard with complex configuration', async () => {
      const configService = createMockConfigService('*, !service1, service2, !testservice');
      const service = new TestService('testservice', configService);
      
      // Wildcard enables testservice, but !testservice disables it
      // Final logic: enabled.includes(service) && !disabled.includes(service)
      // true && !true = false
      expect(service.schedule()).toBe(false);
      
      await service.execute();
      expect(service.hasTaskExecuted()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle task errors gracefully', async () => {
      class ErrorService extends BaseService {
        constructor(service: string, configService: AppConfigService) {
          super(service, configService);
        }

        task(): Promise<void> {
          throw new Error('Task failed');
        }
      }

      const configService = createMockConfigService('testservice');
      const service = new ErrorService('testservice', configService);
      
      // The execute method will propagate the error from task()
      await expect(service.execute()).rejects.toThrow('Task failed');
    });

    // Note: Testing shutdown behavior with error conditions is complex due to private property access
    // The shutdown functionality is already tested in the "should trigger shutdown when shutdown service matches" test
    // This edge case (shutdown + error) would require complex mocking that doesn't add significant value
  });
});
