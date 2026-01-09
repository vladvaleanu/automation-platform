/**
 * Unit tests for EventBusService
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventBusService } from '../../services/event-bus.service';
import { DatabaseService } from '../../services/database.service';
import Redis from 'ioredis';

// Mock Redis
jest.mock('ioredis');

describe('EventBusService', () => {
  let eventBusService: EventBusService;
  let mockPublisher: any;
  let mockSubscriber: any;

  beforeEach(() => {
    // Create mock Redis instances
    mockPublisher = {
      publish: jest.fn().mockResolvedValue(1),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    mockSubscriber = {
      subscribe: jest.fn().mockResolvedValue(undefined),
      psubscribe: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    // Mock Redis constructor
    (Redis as any).mockImplementation(() => {
      const instance = mockPublisher;
      return instance;
    });

    eventBusService = new EventBusService();
  });

  afterEach(async () => {
    await eventBusService.disconnect();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(eventBusService.initialize()).resolves.not.toThrow();
    });
  });

  describe('Event Emission', () => {
    beforeEach(async () => {
      await eventBusService.initialize();
    });

    it('should emit an event', async () => {
      const eventName = 'test.event';
      const payload = { message: 'Hello World' };

      await eventBusService.emit(eventName, payload);

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        'events',
        expect.stringContaining(eventName)
      );
    });

    it('should emit event with correct payload structure', async () => {
      const eventName = 'user.created';
      const payload = { userId: '123', email: 'test@example.com' };

      await eventBusService.emit(eventName, payload);

      const publishCall = mockPublisher.publish.mock.calls[0];
      const publishedData = JSON.parse(publishCall[1]);

      expect(publishedData).toMatchObject({
        name: eventName,
        payload,
        source: expect.any(String),
      });
    });

    it('should include source in emitted event', async () => {
      const eventName = 'module.loaded';
      const payload = { moduleId: 'test-module' };
      const source = 'test-service';

      await eventBusService.emit(eventName, payload, source);

      const publishCall = mockPublisher.publish.mock.calls[0];
      const publishedData = JSON.parse(publishCall[1]);

      expect(publishedData.source).toBe(source);
    });
  });

  describe('Event Subscription', () => {
    beforeEach(async () => {
      await eventBusService.initialize();
    });

    it('should subscribe to specific event', () => {
      const eventName = 'test.event';
      const handler = jest.fn();

      eventBusService.on(eventName, handler);

      // Verify subscription was registered
      const subscriptions = (eventBusService as any).subscriptions.get(eventName);
      expect(subscriptions).toBeDefined();
      expect(subscriptions.length).toBe(1);
      expect(subscriptions[0].handler).toBe(handler);
    });

    it('should allow multiple handlers for same event', () => {
      const eventName = 'test.event';
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBusService.on(eventName, handler1);
      eventBusService.on(eventName, handler2);

      const subscriptions = (eventBusService as any).subscriptions.get(eventName);
      expect(subscriptions.length).toBe(2);
    });

    it('should subscribe to event pattern', () => {
      const pattern = 'module.*';
      const handler = jest.fn();

      eventBusService.onPattern(pattern, handler);

      const subscriptions = (eventBusService as any).subscriptions.get(pattern);
      expect(subscriptions).toBeDefined();
      expect(subscriptions[0].pattern).toBe(pattern);
    });
  });

  describe('Pattern Matching', () => {
    beforeEach(async () => {
      await eventBusService.initialize();
    });

    it('should match wildcard pattern', () => {
      const matchesPattern = (eventBusService as any).matchesPattern.bind(eventBusService);

      expect(matchesPattern('module.loaded', 'module.*')).toBe(true);
      expect(matchesPattern('module.unloaded', 'module.*')).toBe(true);
      expect(matchesPattern('user.created', 'module.*')).toBe(false);
    });

    it('should match multi-level wildcard pattern', () => {
      const matchesPattern = (eventBusService as any).matchesPattern.bind(eventBusService);

      expect(matchesPattern('module.test.loaded', 'module.*.loaded')).toBe(true);
      expect(matchesPattern('module.prod.loaded', 'module.*.loaded')).toBe(true);
      expect(matchesPattern('module.test.unloaded', 'module.*.loaded')).toBe(false);
    });

    it('should match exact event name', () => {
      const matchesPattern = (eventBusService as any).matchesPattern.bind(eventBusService);

      expect(matchesPattern('user.created', 'user.created')).toBe(true);
      expect(matchesPattern('user.updated', 'user.created')).toBe(false);
    });
  });

  describe('Unsubscription', () => {
    beforeEach(async () => {
      await eventBusService.initialize();
    });

    it('should unsubscribe from event', () => {
      const eventName = 'test.event';
      const handler = jest.fn();

      const unsubscribe = eventBusService.on(eventName, handler);
      unsubscribe();

      const subscriptions = (eventBusService as any).subscriptions.get(eventName);
      expect(subscriptions).toBeUndefined();
    });

    it('should unsubscribe only specific handler', () => {
      const eventName = 'test.event';
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const unsubscribe1 = eventBusService.on(eventName, handler1);
      eventBusService.on(eventName, handler2);

      unsubscribe1();

      const subscriptions = (eventBusService as any).subscriptions.get(eventName);
      expect(subscriptions.length).toBe(1);
      expect(subscriptions[0].handler).toBe(handler2);
    });
  });

  describe('Event Handler Execution', () => {
    beforeEach(async () => {
      await eventBusService.initialize();
    });

    it('should call handler when matching event occurs', async () => {
      const eventName = 'test.event';
      const payload = { data: 'test' };
      const handler = jest.fn();

      eventBusService.on(eventName, handler);

      // Simulate event reception
      const handleMessage = (eventBusService as any).handleMessage.bind(eventBusService);
      await handleMessage('events', JSON.stringify({
        name: eventName,
        payload,
        source: 'test',
      }));

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: eventName,
          payload,
          source: 'test',
        })
      );
    });

    it('should call pattern handler for matching events', async () => {
      const handler = jest.fn();
      eventBusService.onPattern('module.*', handler);

      // Simulate event reception
      const handleMessage = (eventBusService as any).handleMessage.bind(eventBusService);
      await handleMessage('events', JSON.stringify({
        name: 'module.loaded',
        payload: { moduleId: 'test' },
        source: 'system',
      }));

      expect(handler).toHaveBeenCalled();
    });

    it('should not call handler for non-matching events', async () => {
      const handler = jest.fn();
      eventBusService.on('user.created', handler);

      // Simulate different event
      const handleMessage = (eventBusService as any).handleMessage.bind(eventBusService);
      await handleMessage('events', JSON.stringify({
        name: 'user.deleted',
        payload: {},
        source: 'test',
      }));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await eventBusService.initialize();
    });

    it('should handle errors in event handlers gracefully', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      eventBusService.on('test.event', handler);

      const handleMessage = (eventBusService as any).handleMessage.bind(eventBusService);

      // Should not throw
      await expect(handleMessage('events', JSON.stringify({
        name: 'test.event',
        payload: {},
        source: 'test',
      }))).resolves.not.toThrow();
    });

    it('should handle malformed event data', async () => {
      const handler = jest.fn();
      eventBusService.on('test.event', handler);

      const handleMessage = (eventBusService as any).handleMessage.bind(eventBusService);

      // Should not throw on invalid JSON
      await expect(handleMessage('events', 'invalid json')).resolves.not.toThrow();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    beforeEach(async () => {
      await eventBusService.initialize();
    });

    it('should disconnect cleanly', async () => {
      await eventBusService.disconnect();

      expect(mockPublisher.disconnect).toHaveBeenCalled();
      expect(mockSubscriber.disconnect).toHaveBeenCalled();
    });

    it('should clear all subscriptions on disconnect', async () => {
      eventBusService.on('test.event', jest.fn());
      eventBusService.onPattern('module.*', jest.fn());

      await eventBusService.disconnect();

      const subscriptions = (eventBusService as any).subscriptions;
      expect(subscriptions.size).toBe(0);
    });
  });
});
