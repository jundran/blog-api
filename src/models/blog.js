import mongoose from 'mongoose'
import { Str } from '@supercharge/strings'
import CommentSchema from './comment.js'

const Schema = mongoose.Schema

const BlogSchema = new Schema({
	title: {
		type: String,
		required: true
	},
	text: {
		type: String,
		required: true
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User',
		required: true
	},
	isPublished: {
		type: Boolean,
		default: false

	},
	comments: {
		type: [CommentSchema]
	}
},
{
	timestamps: true
})

BlogSchema.pre('save', function (next) {
	formatFields(this)
	next()
})

BlogSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
	formatFields(this._update)
	next()
})

function formatFields (document) {
	if (document.title) document.title =
		document.title.charAt(0).toUpperCase() + document.title.slice(1)
}

BlogSchema.set('toJSON', { virtuals: true })

BlogSchema.virtual('summary').get(function () {
	return Str(this.text).limit(230, '...').get()
})

export default mongoose.model('Blog', BlogSchema)
