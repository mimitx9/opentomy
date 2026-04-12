export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'DomainException'
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED')
    this.name = 'UnauthorizedException'
  }
}

export class ForbiddenException extends DomainException {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN')
    this.name = 'ForbiddenException'
  }
}

export class NotFoundException extends DomainException {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND')
    this.name = 'NotFoundException'
  }
}

export class ConflictException extends DomainException {
  constructor(message: string) {
    super(message, 'CONFLICT')
    this.name = 'ConflictException'
  }
}

export class ValidationException extends DomainException {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationException'
  }
}

export class AccessDeniedException extends DomainException {
  constructor(
    public readonly meta: {
      tier: string
      trialEndsAt?: Date | null
      upgradeUrl: string
    },
  ) {
    super('Access denied', 'ACCESS_DENIED')
    this.name = 'AccessDeniedException'
  }
}

export class FileTooLargeException extends DomainException {
  constructor() {
    super('File too large (max 50MB)', 'FILE_TOO_LARGE')
    this.name = 'FileTooLargeException'
  }
}

export class InvalidFileException extends DomainException {
  constructor() {
    super('Invalid .optmy file', 'INVALID_FILE')
    this.name = 'InvalidFileException'
  }
}

export class ServerMisconfigurationException extends DomainException {
  constructor() {
    super('Server misconfiguration', 'SERVER_ERROR')
    this.name = 'ServerMisconfigurationException'
  }
}
