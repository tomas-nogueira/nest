class PostValidationError extends Error {}

class PostAuthorizationError extends Error {}

class PostNotFoundError extends Error {
	constructor() {
		super("Post nao encontrado.");
	}
}

class StudentCourseRequiredError extends Error {
	constructor() {
		super("Seu cadastro nao esta vinculado a um curso.");
	}
}

export { PostAuthorizationError, PostNotFoundError, PostValidationError, StudentCourseRequiredError };
