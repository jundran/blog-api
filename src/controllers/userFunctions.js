import jwt from 'jsonwebtoken'
import { body } from 'express-validator'
import AppError, { ValidationError } from '../error.js'

export const validateFields = [
	body('firstname', 'First name must not be empty.').trim().isLength({ min: 1 }),
	body('surname', 'Surname must not be empty.').trim().isLength({ min: 1 }),
	body('email', 'Email is not formatted correctly.').trim().isEmail()
]

export const validatePassword = (req, res, next) => {
	// Password is unchanged for existing user
	if (req.user && !req.body.password && !req.body.passwordConfirm) {
		return next()
	}

	if (!req.errors) req.errors = []

	// Verify password does not contain whitespace
	if (/\s/g.test(req.body.password)) {
		req.errors.push('Password cannot contain empty spaces.')
	}
	// Verify length
	if (req.body.password.length < 8) {
		req.errors.push('Password must be at least 8 characters.')
	}
	// Verify passwords match
	if (req.body.password !== req.body.passwordConfirm) {
		req.errors.push('Passwords do not match.')
	}
	next()
}

export function signTokenAndReturn (res, next, user, update) {
	const plainObject = user.toObject()
	delete plainObject.password
	jwt.sign(plainObject, 'secretkey', (err, token) => {
		if (err) return next(new AppError(500, 'Error signing user object', err))
		res.status(update ? 200 : 201)
		res.cookie('token', token, { httpOnly: true, sameSite: 'Strict' })
		res.json({ user: plainObject, token })
	})
}

export const handleDocumentSaveError = async (req, res, next, err) => {
	if (err?.code === 11000) {
		return next(new ValidationError('An account with this email already exists'))
	}
	next(new AppError(500, 'Unable to save document to database', err))
}
