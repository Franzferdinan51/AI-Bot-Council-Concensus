/**
 * Unified Input Validation Service
 * Validates all MCP tool inputs with standardized error handling
 */

export interface ValidationError {
  status: 'error';
  errorType: 'VALIDATION_ERROR';
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export class ValidationService {
  private static readonly MAX_STRING_LENGTH = 10000;
  private static readonly MAX_ARRAY_LENGTH = 100;
  private static readonly MAX_OBJECT_KEYS = 50;

  /**
   * Validate input against a set of rules
   */
  static validate(input: any, rules: ValidationRule[]): ValidationResult {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const value = input?.[rule.field];
      const fieldErrors = this.validateField(rule, value, input);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a single field
   */
  private static validateField(
    rule: ValidationRule,
    value: any,
    input: any
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required field check
    if (rule.required && (value === undefined || value === null)) {
      errors.push({
        status: 'error',
        errorType: 'VALIDATION_ERROR',
        field: rule.field,
        message: `Field '${rule.field}' is required`,
        code: 'REQUIRED_FIELD_MISSING'
      });
      return errors;
    }

    // Skip further validation if field is missing and not required
    if (value === undefined || value === null) {
      return errors;
    }

    // Type validation
    if (rule.type) {
      const typeError = this.validateType(value, rule);
      if (typeError) {
        errors.push(typeError);
        return errors; // Don't continue if type is wrong
      }
    }

    // String-specific validations
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          status: 'error',
          errorType: 'VALIDATION_ERROR',
          field: rule.field,
          message: `Field '${rule.field}' must be at least ${rule.minLength} characters`,
          code: 'STRING_TOO_SHORT'
        });
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          status: 'error',
          errorType: 'VALIDATION_ERROR',
          field: rule.field,
          message: `Field '${rule.field}' must not exceed ${rule.maxLength} characters`,
          code: 'STRING_TOO_LONG'
        });
      } else if (value.length > this.MAX_STRING_LENGTH) {
        errors.push({
          status: 'error',
          errorType: 'VALIDATION_ERROR',
          field: rule.field,
          message: `Field '${rule.field}' exceeds maximum length of ${this.MAX_STRING_LENGTH} characters`,
          code: 'STRING_EXCEEDS_MAX_LENGTH'
        });
      }

      // Check for empty string
      if (value.trim() === '') {
        errors.push({
          status: 'error',
          errorType: 'VALIDATION_ERROR',
          field: rule.field,
          message: `Field '${rule.field}' cannot be empty`,
          code: 'EMPTY_STRING'
        });
      }
    }

    // Number-specific validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          status: 'error',
          errorType: 'VALIDATION_ERROR',
          field: rule.field,
          message: `Field '${rule.field}' must be at least ${rule.min}`,
          code: 'NUMBER_TOO_SMALL'
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          status: 'error',
          errorType: 'VALIDATION_ERROR',
          field: rule.field,
          message: `Field '${rule.field}' must not exceed ${rule.max}`,
          code: 'NUMBER_TOO_LARGE'
        });
      }
    }

    // Array-specific validations
    if (Array.isArray(value)) {
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          status: 'error',
          errorType: 'VALIDATION_ERROR',
          field: rule.field,
          message: `Field '${rule.field}' must not have more than ${rule.maxLength} items`,
          code: 'ARRAY_TOO_LARGE'
        });
      } else if (value.length > this.MAX_ARRAY_LENGTH) {
        errors.push({
          status: 'error',
          errorType: 'VALIDATION_ERROR',
          field: rule.field,
          message: `Field '${rule.field}' exceeds maximum array length of ${this.MAX_ARRAY_LENGTH}`,
          code: 'ARRAY_EXCEEDS_MAX_LENGTH'
        });
      }
    }

    // Object-specific validations
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      const keys = Object.keys(value);
      if (keys.length > this.MAX_OBJECT_KEYS) {
        errors.push({
          status: 'error',
          errorType: 'VALIDATION_ERROR',
          field: rule.field,
          message: `Field '${rule.field}' has too many properties (max: ${this.MAX_OBJECT_KEYS})`,
          code: 'OBJECT_TOO_LARGE'
        });
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push({
        status: 'error',
        errorType: 'VALIDATION_ERROR',
        field: rule.field,
        message: `Field '${rule.field}' does not match required pattern`,
        code: 'PATTERN_MISMATCH'
      });
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        const message = typeof result === 'string' ? result : `Field '${rule.field}' is invalid`;
        errors.push({
          status: 'error',
          errorType: 'VALIDATION_ERROR',
          field: rule.field,
          message,
          code: 'CUSTOM_VALIDATION_FAILED'
        });
      }
    }

    return errors;
  }

  /**
   * Validate input type
   */
  private static validateType(value: any, rule: ValidationRule): ValidationError | null {
    const expectedType = rule.type;
    let actualType: string;

    if (Array.isArray(value)) {
      actualType = 'array';
    } else if (value === null) {
      actualType = 'null';
    } else {
      actualType = typeof value;
    }

    if (actualType !== expectedType) {
      return {
        status: 'error',
        errorType: 'VALIDATION_ERROR',
        field: rule.field,
        message: `Field '${rule.field}' must be of type '${expectedType}', got '${actualType}'`,
        code: 'TYPE_MISMATCH'
      };
    }

    return null;
  }

  /**
   * Create a standardized error response
   */
  static createErrorResponse(errors: ValidationError[]): {
    content: Array<{ type: 'text'; text: string }>;
  } {
    const errorMessages = errors.map(e => `${e.field}: ${e.message}`).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            errorType: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            errors: errors
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Validate council session input
   */
  static validateCouncilInput(input: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'topic',
        required: false,
        type: 'string',
        minLength: 3,
        maxLength: 5000,
        custom: (value) => {
          if (typeof value !== 'string') return 'Topic must be a string';
          if (value.trim().length === 0) return 'Topic cannot be empty';
          // Check for suspicious patterns
          if (value.includes('<script') || value.includes('javascript:')) {
            return 'Topic contains potentially malicious content';
          }
          return true;
        }
      },
      {
        field: 'settings',
        type: 'object',
        custom: (value) => {
          if (value === undefined || value === null) return true;
          if (typeof value !== 'object' || Array.isArray(value)) {
            return 'Settings must be an object';
          }
          // Check nested properties
          if (value.bots && !Array.isArray(value.bots)) {
            return 'Settings.bots must be an array';
          }
          if (value.economyMode !== undefined && typeof value.economyMode !== 'boolean') {
            return 'Settings.economyMode must be a boolean';
          }
          return true;
        }
      },
      {
        field: 'context',
        type: 'string',
        maxLength: 5000,
        custom: (value) => {
          if (value === undefined || value === null) return true;
          if (typeof value !== 'string') return 'Context must be a string';
          if (value.includes('<script') || value.includes('javascript:')) {
            return 'Context contains potentially malicious content';
          }
          return true;
        }
      }
    ];

    return this.validate(input, rules);
  }

  /**
   * Validate session ID
   */
  static validateSessionId(sessionId: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'sessionId',
        required: true,
        type: 'string',
        pattern: /^session-[0-9]+-[a-z0-9]+$/i,
        custom: (value) => {
          if (typeof value !== 'string') return 'Session ID must be a string';
          if (value.length < 10 || value.length > 100) {
            return 'Session ID must be between 10 and 100 characters';
          }
          return true;
        }
      }
    ];

    return this.validate({ sessionId }, rules);
  }

  /**
   * Validate bot update input
   */
  static validateBotUpdate(input: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'botId',
        required: true,
        type: 'string',
        pattern: /^[a-z0-9-]+$/i,
        custom: (value) => {
          if (typeof value !== 'string') return 'Bot ID must be a string';
          if (value.length < 3 || value.length > 50) {
            return 'Bot ID must be between 3 and 50 characters';
          }
          return true;
        }
      },
      {
        field: 'updates',
        required: true,
        type: 'object',
        custom: (value) => {
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return 'Updates must be an object';
          }
          const allowedFields = ['enabled', 'persona', 'model', 'apiKey', 'endpoint', 'color'];
          const keys = Object.keys(value);
          if (keys.length === 0) {
            return 'At least one update field must be provided';
          }
          for (const key of keys) {
            if (!allowedFields.includes(key)) {
              return `Field '${key}' is not updatable. Allowed fields: ${allowedFields.join(', ')}`;
            }
          }
          return true;
        }
      }
    ];

    return this.validate(input, rules);
  }

  /**
   * Validate memory/document input
   */
  static validateMemoryInput(input: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'topic',
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 200
      },
      {
        field: 'content',
        required: true,
        type: 'string',
        minLength: 10,
        maxLength: 10000
      },
      {
        field: 'tags',
        type: 'array',
        custom: (value) => {
          if (value === undefined || value === null) return true;
          if (!Array.isArray(value)) return 'Tags must be an array';
          if (value.length > 20) return 'Maximum 20 tags allowed';
          for (const tag of value) {
            if (typeof tag !== 'string') {
              return 'All tags must be strings';
            }
            if (tag.length > 50) {
              return 'Each tag must not exceed 50 characters';
            }
          }
          return true;
        }
      }
    ];

    return this.validate(input, rules);
  }

  /**
   * Validate search input
   */
  static validateSearchInput(input: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'query',
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 1000,
        custom: (value) => {
          if (typeof value !== 'string') return 'Query must be a string';
          if (value.trim().length === 0) return 'Query cannot be empty';
          return true;
        }
      },
      {
        field: 'limit',
        type: 'number',
        min: 1,
        max: 100,
        custom: (value) => {
          if (value === undefined || value === null) return true;
          if (!Number.isInteger(value)) return 'Limit must be an integer';
          return true;
        }
      }
    ];

    return this.validate(input, rules);
  }

  /**
   * Validate document input
   */
  static validateDocumentInput(input: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'title',
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 200,
        custom: (value) => {
          if (typeof value !== 'string') return 'Title must be a string';
          if (value.trim().length === 0) return 'Title cannot be empty';
          if (value.includes('<script') || value.includes('javascript:')) {
            return 'Title contains potentially malicious content';
          }
          return true;
        }
      },
      {
        field: 'content',
        required: true,
        type: 'string',
        minLength: 10,
        maxLength: 50000,
        custom: (value) => {
          if (typeof value !== 'string') return 'Content must be a string';
          if (value.trim().length === 0) return 'Content cannot be empty';
          if (value.includes('<script') || value.includes('javascript:')) {
            return 'Content contains potentially malicious content';
          }
          return true;
        }
      }
    ];

    return this.validate(input, rules);
  }

  /**
   * Validate document search input
   */
  static validateDocumentSearchInput(input: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'query',
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 1000,
        custom: (value) => {
          if (typeof value !== 'string') return 'Query must be a string';
          if (value.trim().length === 0) return 'Query cannot be empty';
          return true;
        }
      },
      {
        field: 'limit',
        type: 'number',
        min: 1,
        max: 50,
        custom: (value) => {
          if (value === undefined || value === null) return true;
          if (!Number.isInteger(value)) return 'Limit must be an integer';
          return true;
        }
      }
    ];
    return this.validate(input, rules);
  }

  /**
   * Validate diagnostics input
   */
  static validateDiagnosticsInput(input: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'verbose',
        type: 'boolean'
      },
      {
        field: 'preset',
        type: 'string',
        custom: (value) => {
          if (value === undefined || value === null) return true;
          const validPresets = ['quick', 'full', 'connectivity', 'config'];
          if (!validPresets.includes(value)) {
            return `Preset must be one of: ${validPresets.join(', ')}`;
          }
          return true;
        }
      },
      {
        field: 'includeTests',
        type: 'boolean'
      }
    ];

    return this.validate(input, rules);
  }
}
