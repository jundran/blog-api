import { validationResult } from 'express-validator'
import { ValidationError } from './error.js'

export function addErrorsToRequestObject (req, next) {
	const errors = validationResult(req).array().map(err => err.msg)
	if (!req.errors) req.errors = []
	req.errors = [...errors, ...req.errors]
	next()
}

export function handleValidationFailure (req, res, next) {
	if (req.errors.length) next(new ValidationError(req.errors))
	else next()
}
