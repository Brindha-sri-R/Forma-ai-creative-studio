export class QuotaExceededError extends Error {
  statusCode = 429;
  model: string;
  retryAfterSeconds?: number;
  provider: string;

  constructor(model: string, message: string, retryAfterSeconds?: number, provider = 'Google Gemini') {
    super(message);
    this.name = 'QuotaExceededError';
    this.model = model;
    this.retryAfterSeconds = retryAfterSeconds;
    this.provider = provider;
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  provider: string;

  constructor(provider: string, message = 'Invalid or expired API key') {
    super(message);
    this.name = 'AuthenticationError';
    this.provider = provider;
  }
}

export class ModelUnavailableError extends Error {
  statusCode = 404;
  model: string;

  constructor(model: string, message = `Model ${model} is not available on this API version or project`) {
    super(message);
    this.name = 'ModelUnavailableError';
    this.model = model;
  }
}

export class GenerationFailedError extends Error {
  statusCode = 502;
  provider: string;

  constructor(provider: string, message: string) {
    super(message);
    this.name = 'GenerationFailedError';
    this.provider = provider;
  }
}

