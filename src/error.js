export default class AppError extends Error {
	constructor (status, message, error) {
		super()
		this.name = error?.name || 'AppError'
		this.status = status
		this.message = message
		if (error) this.originalError = error.message
	}
}

export class ValidationError extends AppError {
	constructor (errorMessages) {
		super(400, 'Request body failed validation')
		this.name = 'ValidationError'
		this.validationMessages = Array.isArray(errorMessages) ?
			errorMessages : [errorMessages]
	}
}
