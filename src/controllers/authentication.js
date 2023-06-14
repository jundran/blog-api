import asyncHandler from '../asyncHandler.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import AppError from '../error.js'

export const login = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email })
	if (!user) return next(new AppError(404, 'User not found'))
	if (!user.isActive) return next(new AppError(403, 'User account is disabled'))

	bcrypt.compare(req.body.password, user.password, (err, match) => {
		if (err) console.error(err)
		if (!match) return next(new AppError(400, 'Wrong password'))
		const accessToken = createAccessToken({ id: user.id })
		const refreshToken = createRefreshToken({ id: user.id })
		user.refreshToken = refreshToken
		user.save() // Replace refresh token
		const plainUser = user.toObject()
		delete plainUser.password
		delete plainUser.refreshToken
		res.json({ user: plainUser, accessToken, refreshToken })
	})
})

// Client is responsibe for deleting access token
// Access token has short expiry time but will still be valid until it expires
// Refresh token is removed from the DB so access token cannot be refreshed
export const logout = asyncHandler(async (req, res, next) => {
	await User.findByIdAndUpdate(req.user.id, { refreshToken: null })
	res.sendStatus(204)
})

export function validateUser (req, res, next) {
	const token = req.get('Authorization')?.split('Bearer ')[1]
	if (!token) return next(new AppError(401, 'Missing access token'))

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) return next(new AppError(403, 'Unable to verify access token', err))
		req.user = user
		next()
	})
}

export const RefreshAccessToken = asyncHandler(async (req, res, next) => {
	const token = req.get('Authorization')?.split('Bearer ')[1]
	if (!token) return next(new AppError(401, 'Missing refresh token'))

	jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, payload) => {
		if (err) return next(new AppError(403, 'Unable to verify refresh token', err))
		const user = await User.findById(payload.id)
		if (!user) return next(new AppError(404, 'User account not found'))
		if (!user.isActive) return next(new AppError(403, 'User account is disabled'))
		if (!user.refreshToken) return next(new AppError(403, 'Refresh token is not valid'))
		res.json({ accessToken: createAccessToken({ id: user.id }) })
	})
})

export function createAccessToken (payload) { // 5 minute expiry but shorter for testing
	return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET,	{ expiresIn: '30s' })
}

export function createRefreshToken (payload) {
	return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '28d' })
}
