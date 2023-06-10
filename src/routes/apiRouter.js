import express from 'express'
import { login, validateUser, returnUserWithToken } from '../controllers/authentication.js'
import { createUser, updateUser, deleteAccount } from '../controllers/user.js'
import {
	getAllPublishedBlogs,
	getUserBlogs,
	getBlog,
	createBlog,
	updateBlog,
	deleteBlog,
	postComment,
	deleteComment
} from '../controllers/blog.js'

const router = express.Router()

router.get('/', (req, res) => {
	res.json({ message: 'Welcome to the Blog API version 1' })
})

// Authentication
router.post('/user/login', login)

// User
router.post('/user', createUser)
router.get('/user', validateUser, returnUserWithToken)
router.put('/user', validateUser, updateUser)
router.delete('/user', validateUser, deleteAccount)

// Blog
router.post('/blog', validateUser, createBlog)
router.get('/blog/published', getAllPublishedBlogs)
router.get('/blog/current-user', validateUser, getUserBlogs)
router.get('/blog/:id', getBlog)
router.put('/blog/:id', validateUser, updateBlog)
router.delete('/blog/:id', validateUser, deleteBlog)

// Comments
router.post('/blog/:id/comment', postComment)
router.delete('/blog/:id/comment/:commentId', validateUser, deleteComment)

export default router
