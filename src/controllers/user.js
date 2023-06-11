import bcrypt from 'bcrypt'
import asyncHandler from '../asyncHandler.js'
import { body } from 'express-validator'
import AppError, { ValidationError } from '../error.js'
import { addErrorsToRequestObject, handleValidationFailure } from '../validation.js'
import { generateAccessToken, generateRefreshToken } from './authentication.js'
import User from '../models/user.js'
import Blog from '../models/blog.js'

const validateFields = [
	body('firstname', 'First name must not be empty.').trim().isLength({ min: 1 }),
	body('surname', 'Surname must not be empty.').trim().isLength({ min: 1 }),
	body('email', 'Email is not formatted correctly.').trim().isEmail()
]

export const getUser = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id)
	if (!user) return next(new AppError(404, 'User not found'))
	res.json({ user })
})

export const createUser = [
	...validateFields,
	validatePassword,
	(req, res, next) => addErrorsToRequestObject(req, next, false),
	(req, res, next) => handleValidationFailure(req, res, next),

	asyncHandler(async (req, res, next) => {
		// Create user object from request body
		const hashedPassword = await bcrypt.hash(req.body.password, 10)
		const user = {
			firstname: req.body.firstname,
			surname: req.body.surname,
			email: req.body.email,
			password: hashedPassword
		}

		// Generate access tokens and include refresh to be saved
		const accessToken = generateAccessToken({ id : user.id })
		const refreshToken = generateRefreshToken({ id : user.id })
		user.refreshToken = refreshToken

		// Create and save document from Model constructor
		const document = new User(user)
		await document.save()

		// Return regular user object, omitting unnecessary fields
		const plainUser = document.toObject()
		delete plainUser.password
		delete plainUser.refreshToken
		res.status(201)
		res.json({ user: plainUser, accessToken, refreshToken })
	})
]

export const updateUser = [
	...validateFields,
	validatePassword,
	(req, res, next) => addErrorsToRequestObject(req, next, true),
	(req, res, next) => handleValidationFailure(req, res, next),

	asyncHandler(async (req, res, next) => {
		const user = { }
		for (const entry of Object.entries(req.body)) {
			if (!entry[1].trim()) continue // Do not update empty fields
			else user[entry[0]] = entry[1]
		}
		if (req.body.password) {
			const hashedPassword = await bcrypt.hash(req.body.password, 10)
			user.password = hashedPassword
		}

		User.findByIdAndUpdate(req.user.id, user, { new: true }).exec()
			.then(user => {
				if (!user) return next(new AppError(401, 'User not found'))
				delete user.password
				res.json({ user })
			})
			.catch(err => handleDocumentSaveError(req, res, next, err))
	})
]

export const deleteAccount = asyncHandler(async (req, res, next) => {
	await Blog.deleteMany({ user: req.user.id }).exec()
	await User.findByIdAndDelete(req.user.id).exec()
	res.sendStatus(204)
})

function validatePassword (req, res, next) {
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

async function handleDocumentSaveError (req, res, next, err) {
	if (err?.code === 11000) {
		return next(new ValidationError('An account with this email already exists'))
	}
	next(new AppError(500, 'Unable to save document to database', err))
}
