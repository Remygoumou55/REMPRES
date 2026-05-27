export class RuntimeSecurityError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "RuntimeSecurityError";
  }
}

export class MutationDeniedError extends RuntimeSecurityError {
  constructor(message = "Mutation refusée : permissions insuffisantes.") {
    super(message, "mutation:denied");
  }
}

export class MutationUnauthenticatedError extends RuntimeSecurityError {
  constructor(message = "Non authentifié.") {
    super(message, "mutation:unauthenticated");
  }
}
