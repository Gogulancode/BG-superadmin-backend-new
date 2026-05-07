import { Injectable, BadRequestException } from '@nestjs/common';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class PasswordPolicyService {
  private readonly minLength = 10;
  private readonly requirements = {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  };

  validate(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (!password || password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters long`);
    }

    if (!this.requirements.uppercase.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!this.requirements.lowercase.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!this.requirements.number.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!this.requirements.special.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateOrThrow(password: string): void {
    const result = this.validate(password);
    if (!result.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: result.errors,
        requirements: this.getRequirements(),
      });
    }
  }

  getRequirements(): string {
    return `Password must be at least ${this.minLength} characters and include uppercase, lowercase, number, and special character.`;
  }
}
