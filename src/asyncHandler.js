import { ValidationError } from './error.js'

export default function asyncHandler (fn) {
	return (req, res, next) =>
		Promise.resolve(fn(req, res, next)).catch(err => {
			console.log('Error caught by asyncHandler')

			if (err?.code === 11000) {
				return res.json(new ValidationError('An account with this email already exists'))
			}

			next(err)
		})
}
