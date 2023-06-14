import bcrypt from 'bcrypt'
import asyncHandler from '../asyncHandler.js'
import { body } from 'express-validator'
import AppError from '../error.js'
import { addErrorsToRequestObject, handleValidationFailure } from '../validation.js'
import { createAccessToken, createRefreshToken } from './authentication.js'
import User from '../models/user.js'
import Blog from '../models/blog.js'

const validateFields = [
	body('firstname', 'First name must not be empty.').trim().isLength({ min: 1 }),
	body('surname', 'Surname must not be empty.').trim().isLength({ min: 1 }),
	body('email', 'Email is not formatted correctly.').trim().isEmail()
]

export const getUser = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id).select({ refreshToken: 0, password: 0 })
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
		const user = new User({
			firstname: req.body.firstname,
			surname: req.body.surname,
			email: req.body.email,
			password: hashedPassword
		})

		// Create tokens and add refresh token to user object
		const accessToken = createAccessToken({ id : user.id })
		const refreshToken = createRefreshToken({ id : user.id })
		user.refreshToken = refreshToken

		await user.save()

		// Return regular user object, omitting unnecessary fields
		const plainUser = user.toObject()
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
		const update = { }

		// Update password
		if (req.body.password) {
			if (!req.body.existingPassword?.trim()) {
				req.errors.push('Current password is missing.')
				return handleValidationFailure(req, res, next)
			}
			const existingUser = await User.findById(req.user.id)
			const match = await bcrypt.compare(req.body.existingPassword, existingUser.password)
			if (!match) {
				req.errors.push('Current password is wrong.')
				return handleValidationFailure(req, res, next)
			}

			update.refreshToken = createRefreshToken({ id: req.user.id })
			update.password = await bcrypt.hash(req.body.password, 10)
			delete req.body.existingPassword // Tidy up for Object.entries
			delete req.body.password
			delete req.body.passwordConfirm
		}

		// Update non-password fields
		for (const entry of Object.entries(req.body)) {
			if (!entry[1].trim()) continue // Do not update empty fields
			else update[entry[0]] = entry[1]
		}

		const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).exec()
		const plainUser = user.toObject()
		delete plainUser.password
		delete plainUser.refreshToken
		res.json({ user: plainUser })
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
