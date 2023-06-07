import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import apiRouter from './routes/apiRouter.js'
import AppError from './error.js'
import morgan from 'morgan'
import cors from 'cors'

// ENVIRONMENT
const production = process.env.NODE_ENV === 'production'
if (production) console.log('NODE_ENV:', process.env.NODE_ENV)
dotenv.config()

// EXPRESS
const app = express()
if (!production) app.use(morgan('dev'))

app.use(cors({ origin: true, credentials: true }))
// app.use(cors({
// 	origin: [
//		'https://blog-manager.onrender.com',
// 		'https://blog-viewer.onrender.com'
// 	],
// 	credentials: true // allow setting cookie
// }))
app.use(express.json())
app.use(cookieParser())

// ROUTES
app.use('/api/v1', apiRouter)

// CATCH 404
app.use((req, res, next) => {
	next(new AppError(501, 'API route does not exist'))
})

// ERROR HANDLER
app.use(async (err, req, res, next) => {
	// Internally created error
	if (err instanceof AppError) {
		console.error('APP ERROR', err)
		res.status(err.status)
		res.json(err)
	}
	// Handle badly formatted id - will not be caught as a 404 but treat as such
	else if (err.name === 'CastError') {
		res.status(404)
		res.json(new AppError(404, 'Resource not found', err))
	}
	// Mongoose or Express error
	else {
		console.error('EXPRESS ERROR', err)
		const code = err.status || err.statusCode || 500
		res.status(code)
		res.json(new AppError(code, 'Something went wrong with your request', err))
	}
})

const port = 5001
export default () => app.listen(port, () => console.log(`App listening on port ${port}`))
