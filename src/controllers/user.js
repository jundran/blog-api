import bcrypt from 'bcrypt'
import asyncHandler from '../asyncHandler.js'
import AppError from '../error.js'
import User from '../models/user.js'
import Blog from '../models/blog.js'
import { addErrorsToRequestObject, handleValidationFailure } from '../validation.js'
import {
	validateFields,
	validatePassword,
	handleDocumentSaveError,
	signTokenAndReturn
} from './userFunctions.js'

export const createUser = [
	...validateFields,
	validatePassword,
	(req, res, next) => addErrorsToRequestObject(req, next, false),
	(req, res, next) => handleValidationFailure(req, res, next),

	asyncHandler(async (req, res, next) => {
		const hashedPassword = await bcrypt.hash(req.body.password, 10)
		const user = new User({
			firstname: req.body.firstname,
			surname: req.body.surname,
			email: req.body.email,
			password: hashedPassword
		})

		user.save()
			.then(newUser => signTokenAndReturn(res, next, newUser))
			.catch(err => handleDocumentSaveError(req, res, next, err))
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

		User.findByIdAndUpdate(req.user._id, user, { new: true }).exec()
			.then(user => {
				if (!user) {
					res.clearCookie('token', { httpOnly: true, sameSite: 'Strict' })
					return next(new AppError(401, 'User not found in the database'))
				}
				signTokenAndReturn(res, next, user, true)
			})
			.catch(err => handleDocumentSaveError(req, res, next, err))
	})
]

export const deleteAccount = asyncHandler(async (req, res, next) => {
	await Blog.deleteMany({ user: req.user._id }).exec()
	await User.findByIdAndDelete(req.user._id).exec()
	res.clearCookie('token', { httpOnly: true, sameSite: 'Strict' })
	res.sendStatus(204)
})
