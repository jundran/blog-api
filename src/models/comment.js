import mongoose from 'mongoose'

const Schema = mongoose.Schema

// Just returning the Schema to be used as a sub document
export default new Schema({
	name: {
		type: String,
		required: true
	},
	text: {
		type: String,
		required: true
	}
},
{
	timestamps: true
})
