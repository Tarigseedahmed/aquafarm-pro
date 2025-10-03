import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

// Password strength validator
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (!password) return false;

    // At least 8 characters
    if (password.length < 8) return false;

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) return false;

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) return false;

    // At least one number
    if (!/\d/.test(password)) return false;

    // At least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
}

// Email format validator
@ValidatorConstraint({ name: 'isValidEmail', async: false })
export class IsValidEmailConstraint implements ValidatorConstraintInterface {
  validate(email: string, args: ValidationArguments) {
    if (!email) return false;
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Please provide a valid email address';
  }
}

// Phone number validator
@ValidatorConstraint({ name: 'isValidPhone', async: false })
export class IsValidPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: string, args: ValidationArguments) {
    if (!phone) return true; // Optional field
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (7-15 digits)
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Please provide a valid phone number';
  }
}

// Coordinate validator
@ValidatorConstraint({ name: 'isValidCoordinate', async: false })
export class IsValidCoordinateConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    if (typeof value !== 'number') return false;
    
    const [property] = args.constraints;
    
    if (property === 'latitude') {
      return value >= -90 && value <= 90;
    } else if (property === 'longitude') {
      return value >= -180 && value <= 180;
    }
    
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    const [property] = args.constraints;
    if (property === 'latitude') {
      return 'Latitude must be between -90 and 90 degrees';
    } else if (property === 'longitude') {
      return 'Longitude must be between -180 and 180 degrees';
    }
    return 'Invalid coordinate value';
  }
}

// Positive number validator
@ValidatorConstraint({ name: 'isPositiveNumber', async: false })
export class IsPositiveNumberConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    if (typeof value !== 'number') return false;
    return value > 0;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Value must be a positive number';
  }
}

// Non-negative number validator
@ValidatorConstraint({ name: 'isNonNegativeNumber', async: false })
export class IsNonNegativeNumberConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    if (typeof value !== 'number') return false;
    return value >= 0;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Value must be a non-negative number';
  }
}

// Date range validator
@ValidatorConstraint({ name: 'isValidDateRange', async: false })
export class IsValidDateRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value) return true; // Optional field
    
    const object = args.object as any;
    const [startDateField] = args.constraints;
    
    if (!startDateField || !object[startDateField]) return true;
    
    const startDate = new Date(object[startDateField]);
    const endDate = new Date(value);
    
    return endDate >= startDate;
  }

  defaultMessage(args: ValidationArguments) {
    const [startDateField] = args.constraints;
    return `${startDateField} must be before or equal to the end date`;
  }
}

// Custom decorators
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidEmailConstraint,
    });
  };
}

export function IsValidPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPhoneConstraint,
    });
  };
}

export function IsValidCoordinate(property: 'latitude' | 'longitude', validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsValidCoordinateConstraint,
    });
  };
}

export function IsPositiveNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPositiveNumberConstraint,
    });
  };
}

export function IsNonNegativeNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNonNegativeNumberConstraint,
    });
  };
}

export function IsValidDateRange(startDateField: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [startDateField],
      validator: IsValidDateRangeConstraint,
    });
  };
}
