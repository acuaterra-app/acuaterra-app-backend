# API Documentation with Swagger

This document outlines how to access, maintain, and extend the API documentation in this project using Swagger.

## Accessing the API Documentation

The API documentation is automatically served when you run the application:

1. Start the server with `npm start` or `node server.js`
2. Access the documentation at [http://localhost:3000/api-docs](http://localhost:3000/api-docs) (or whatever port your application is running on)

The root URL of the application (`/`) also redirects to the Swagger UI documentation page for convenience.

## Documentation Structure

The API documentation is organized as follows:

- `app/swagger/swagger.js` - Main Swagger configuration file
- `app/swagger/paths/` - Directory containing path-specific documentation
- `app/swagger/definitions/` - Directory containing schema definitions
- Individual route Swagger files (e.g., `app/swagger/auth.swagger.js`) - Documentation for specific route groups

## How to Maintain the Documentation

### Updating Existing Endpoints

To update documentation for existing endpoints:

1. Locate the corresponding Swagger file in the `app/swagger` directory
2. Update the JSDoc comments or the route-specific Swagger file
3. Restart the server to see your changes

### Adding New Endpoints

When adding new endpoints:

1. Create a new Swagger documentation file if it's a new route group (e.g., `app/swagger/new-feature.swagger.js`)
2. Include the new file in the `app/swagger/swagger.js` configuration
3. Document your new endpoints using the standard format (see examples below)
4. Restart the server to see your changes

## Documentation Best Practices

### General Guidelines

- Use descriptive summaries and descriptions for each endpoint
- Include all possible response codes and their meaning
- Document all request parameters, whether they are in the path, query, or body
- Reference validation rules from the validator files
- Group related endpoints in the same Swagger file

### Example Documentation Format

Here is an example of how to document an endpoint:

```javascript
/**
 * @swagger
 * /api/v2/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
```

### Structured Documentation Files

For larger API groups, create structured documentation files like:

```javascript
// auth.swagger.js
module.exports = {
  paths: {
    '/api/v2/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        // ... rest of the documentation
      }
    },
    '/api/v2/auth/logout': {
      post: {
        // ... documentation
      }
    }
  }
};
```

## Validator Integration

Always reference the corresponding validator file when documenting an endpoint:

1. Check the validation rules in the appropriate validator file (e.g., `app/validators/shared/auth.validator.js`)
2. Ensure your Swagger documentation reflects these validation rules
3. Include all required fields and validation constraints in your documentation

## Testing Documentation

Before committing changes to the documentation:

1. Start the server and access the Swagger UI
2. Verify that your documentation appears correctly
3. Test the "Try it out" functionality to ensure the request format is correct
4. Check that all schemas and models are properly displayed

## Troubleshooting

If your documentation isn't appearing correctly:

- Check for syntax errors in your Swagger JSDoc comments or files
- Ensure all referenced schemas exist
- Verify that your Swagger file is properly included in the main configuration
- Restart the server after making changes to the documentation

