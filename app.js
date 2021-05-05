const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const morgan = require('morgan')
const {
	models: { User, Note },
} = require('./db')

app.use(express.json())

const path = require('path')

app.use(morgan('tiny'))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.post('/api/auth', async (req, res, next) => {
	try {
		// if username/pw matches database, an (encrypted) token is created
		const token = await User.authenticate(req.body)
		if (!token) res.sendStatus(404)
		res.send({ token })
	} catch (ex) {
		next(ex)
	}
})

app.get('/api/auth', async (req, res, next) => {
	try {
		const token = req.headers.authorization
		const user = await User.byToken(token)
		req.user = user
		res.send(req.user)
	} catch (ex) {
		next(ex)
	}
})

app.get('/api/users/:id/notes', async (req, res, next) => {
	try {
		const userNotes = await Note.findAll({
			where: {
				userId: req.params.id,
			},
		})
		res.send(userNotes)
	} catch (error) {
		next(error)
	}
})

app.use((err, req, res, next) => {
	console.log(err)
	res.status(err.status || 500).send({ error: err.message })
})

module.exports = app
