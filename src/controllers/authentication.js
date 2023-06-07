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
		const plainObject = user.toObject()
		delete plainObject.password

		if (match) {
			jwt.sign(plainObject, 'secretkey', (signErr, token) => {
				if (signErr) return next(new AppError(500, 'Error signing user object', signErr))
				res.cookie('token', token, { httpOnly: true, sameSite: 'Strict' })
				res.json({ user, token })
			})
		}
		else next(new AppError(400, 'Wrong password'))
	})
})

export function logout (req, res, next) {
	res.clearCookie('token', { httpOnly: true, sameSite: 'Strict' })
	res.sendStatus(204)
}

export function validateUser (req, res, next) {
	const token = req.cookies.token
	if (!token) return next(new AppError(401, 'Missing token'))

	jwt.verify(token, 'secretkey', (err, user) => {
		if (err) return next(new AppError(401, 'Unable to verify token cookie', err))

		req.user = user
		next()
	})
}
