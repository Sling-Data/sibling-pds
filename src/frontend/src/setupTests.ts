// jest-dom adds custom jest matchers for asserting on DOM nodes.
import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

// Configure Testing Library to minimize DOM output
configure({
  testIdAttribute: "data-testid",
  // Disable debugging output
  getElementError: (message: string | null) => new Error(message || 'Test failed'),
});

// Mock fetch
global.fetch = jest.fn();

// Store original toString for cleanup
let originalElementToString: () => string;

// Suppress all console output during tests
beforeAll(() => {
  // Suppress console
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "debug").mockImplementation(() => {});
  
  // Override toString for DOM elements to prevent large DOM trees in error output
  originalElementToString = Element.prototype.toString;
  Element.prototype.toString = function() {
    return `<${this.tagName.toLowerCase()}${this.id ? ` id="${this.id}"` : ''}${this.className ? ` class="${this.className}"` : ''}>`;
  };
});

// Restore console and DOM behavior after all tests
afterAll(() => {
  jest.restoreAllMocks();
  Element.prototype.toString = originalElementToString;
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
