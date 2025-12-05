// Error classes for structured error handling across BoneCore modules

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class IntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export class HookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HookError';
  }
}

export class UnexpectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnexpectedError';
  }
}

