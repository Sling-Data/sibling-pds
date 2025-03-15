# Example Components

This directory contains example components that demonstrate how to use various features of the application.

## Available Examples

### NotificationExample

Demonstrates how to use the notification system.

- URL: `/notification-example`
- Features:
  - Displaying different types of notifications (success, error, info, warning)
  - Controlling notification duration
  - Creating persistent notifications
  - Clearing all notifications

### FormExample

Demonstrates how to use the form handling system.

- URL: `/form-example`
- Features:
  - Form validation
  - Error handling
  - Form submission
  - Form reset
  - Integration with notifications

### ApiRequestExample

Demonstrates how to use the API request system.

- URL: `/api-example`
- Features:
  - Making GET, POST, and DELETE requests
  - Handling loading states
  - Handling errors
  - Displaying data
  - Integration with notifications

## Using the Examples

These examples are accessible through their respective routes in the application. They serve as both demonstrations and documentation for how to use the various systems in the application.

To view an example, navigate to its URL in the browser.

## Adding New Examples

When adding a new example:

1. Create a new component in this directory
2. Export it from the `index.ts` file
3. Add a route for it in the `App.tsx` file
4. Update this README with information about the example

## Best Practices

1. **Keep examples simple**: Examples should be focused on demonstrating a specific feature or system.
2. **Include comments**: Add comments to explain what's happening in the example.
3. **Use realistic data**: Use realistic data and scenarios to make the examples more relatable.
4. **Show error handling**: Demonstrate how to handle errors and edge cases.
5. **Link to documentation**: If applicable, include links to relevant documentation or source code. 