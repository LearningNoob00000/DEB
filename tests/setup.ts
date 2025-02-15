// tests/setup.ts

// Increase timeout for all tests
jest.setTimeout(10000);

// Add custom matchers if needed
expect.extend({
  // Example custom matcher
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Global test setup
beforeAll(() => {
  // Add any global setup here
});

// Global test teardown
afterAll(() => {
  // Add any global cleanup here
});
