import asyncHandler from '../asyncHandler.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import AppError from '../error.js'

export const login = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email })
	if (!user) return next(new AppError(404, 'User not found'))

	bcrypt.compare(req.body.password, user.password, (err, match) => {
		if (err) console.error(err)

		if (match) returnUserWithTokenFromDocument(res, next, user)
		else next(new AppError(400, 'Wrong password'))
	})
})

export function validateUser (req, res, next) {
	const token = req.get('Authorization')?.split('Bearer ')[1]
	if (!token) return next(new AppError(401, 'Missing token'))

	jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
		if (err) return next(new AppError(401, 'Unable to verify bearer token', err))

		req.user = user
		next()
	})
}

export function returnUserWithTokenFromDocument (res, next, user) {
	const plainObject = user.toObject()
	delete plainObject.password
	jwt.sign(plainObject, process.env.SECRET_KEY, (err, token) => {
		if (err) return next(new AppError(500, 'Error signing user object', err))
		plainObject.token = token
		res.json({ user: plainObject })
	})
}

export function returnUserWithToken (req, res, next) {
	jwt.sign(req.user, process.env.SECRET_KEY, (err, token) => {
		if (err) return next(new AppError(500, 'Error signing user object', err))
		req.user.token = token
		res.json({ user: req.user })
	})
}
