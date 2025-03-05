// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

// Configure Testing Library
configure({
  testIdAttribute: "data-testid",
});

// Mock fetch
global.fetch = jest.fn();

// Suppress console output during tests
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "debug").mockImplementation(() => {});
});

// Restore console after all tests
afterAll(() => {
  jest.restoreAllMocks();
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
