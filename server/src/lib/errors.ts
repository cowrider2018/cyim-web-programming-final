/**
 * Errors that are safe to show a client. Anything else that reaches the error
 * handler is treated as a bug and reported as a generic 500.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Invalid request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'You do not have access to this resource') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Resource already exists', details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

/** Business-rule violations the client can act on, e.g. "only 2 left in stock". */
export class UnprocessableError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(422, 'UNPROCESSABLE', message, details);
  }
}
