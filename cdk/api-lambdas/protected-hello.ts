// The API Gateway is configured so that this Lambda requires an authenticated user.

import { Handler } from 'aws-lambda';

export const handler: Handler = async (_event, _context) => {
  return {
    statusCode: 200,
    body: "Hello from a protected Lambda",
  }
}
