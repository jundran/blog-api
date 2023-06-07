export default function asyncHandler (fn) {
	return (req, res, next) =>
		Promise.resolve(fn(req, res, next)).catch(err => {
			console.log('Error caught by asyncHandler')
			next(err)
		})
}
