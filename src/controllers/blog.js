import jwt from 'jsonwebtoken'
import { body } from 'express-validator'
import asyncHandler from '../asyncHandler.js'
import AppError from '../error.js'
import Blog from '../models/blog.js'
import { addErrorsToRequestObject, handleValidationFailure } from '../validation.js'

export const getAllPublishedBlogs = asyncHandler(async (req, res, next) => {
	const blogs = await Blog.find({ isPublished: true })
		.populate({ path: 'user', select: 'firstname surname' }).exec()
	res.json({ documents: blogs.reverse() })
})

export const getUserBlogs = asyncHandler(async (req, res, next) => {
	const blogs = await Blog.find({ user: req.user.id }).exec()
	res.json({ documents: blogs.reverse() })
})

export const getBlog = asyncHandler(async (req, res, next) => {
	const blog = await Blog.findById(req.params.id)
		// Ensure not to send hashed password or other fields from User
		.populate({ path: 'user', select: 'firstname surname' }).exec()
	if (!blog) return next(new AppError(404, `Blog with id ${req.params.id} not found`))

	if (!blog.isPublished) {
		// Do user authentication here because only unpublished blog requires it
		const token = req.get('Authorization').split('Bearer ')[1]
		if (!token) return next(new AppError(
			401,
			'This blog is not published. If it is your blog, please login.'
		))

		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
			if (err) return next(new AppError(401, 'Unable to verify bearer token', err))
			else if (user.id !== blog.user._id.toString()) {
				return next(new AppError(403,'This blog is not published and does not belong to you.'))
			} else {
				res.json({ document: blog })
			}
		})
	} else {
		res.json({ document: blog })
	}
})

export const createBlog = [
	body('title', 'Blog title must not be empty.').trim().isLength({ min: 1 }),
	body('text', 'Blog text must not be empty.').trim().isLength({ min: 1 }),
	(req, res, next) => addErrorsToRequestObject(req, next, false),
	(req, res, next) => handleValidationFailure(req, res, next),

	asyncHandler(async (req, res, next) => {
		const blog = new Blog({
			title: req.body.title,
			text: req.body.text,
			isPublished: req.body.isPublished,
			user: req.user.id
		})

		await blog.save()
		res.status(201)
		res.json({ document: blog })
	})
]

export const updateBlog = [
	body('title', 'Blog title must not be empty.').trim().isLength({ min: 1 }),
	body('text', 'Blog text must not be empty.').trim().isLength({ min: 1 }),
	(req, res, next) => addErrorsToRequestObject(req, next, true),
	(req, res, next) => handleValidationFailure(req, res, next),

	asyncHandler(async (req, res, next) => {
		const blog = await getBlogAndVerifyOwner(req, next)
		if (!blog) return

		const update = { }
		for (const entry of Object.entries(req.body)) {
			if (typeof entry[1] === 'boolean') update[entry[0]] = entry[1] // checkbox
			else if (entry[1].trim()) update[entry[0]] = entry[1] // text
		}

		// TODO - verify this
		// Use findByIdAndUpdate because updateOne does not return document
		const updatedBlog = await Blog.findByIdAndUpdate(blog.id, update, { new: true }).exec()
		res.json({ document: updatedBlog })
	})
]

export const deleteBlog = asyncHandler(async (req, res, next) => {
	const blog = await getBlogAndVerifyOwner(req, next)
	if (!blog) return
	await blog.deleteOne()
	res.sendStatus(204)
})

export const postComment = asyncHandler(async (req, res, next) => {
	const blog = await Blog.findById(req.params.id)
	if (!blog) return next(new AppError(404, `Blog with id ${req.params.id} not found`))

	blog.comments.unshift({ // latest first
		name: req.body.name,
		text: req.body.text
	})
	await blog.save()
	res.json({ comments: blog.comments })
})

export const deleteComment = asyncHandler(async (req, res, next) => {
	const blog = await getBlogAndVerifyOwner(req, next)
	if (!blog) return

	blog.comments.pull({ _id: req.params.commentId })
	await blog.save()
	res.sendStatus(204)
})

async function getBlogAndVerifyOwner (req, next) {
	const blog = await Blog.findById(req.params.id)
	if (!blog) return next(new AppError(404, `Blog with id ${req.params.id} not found`))
	if (req.user.id === blog.user.toString()) return blog
	else next(new AppError(403, 'This blog does not belong to you'))
}
