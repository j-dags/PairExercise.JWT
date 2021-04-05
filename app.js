const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const morgan = require('morgan')
app.use(express.json())
const {
	models: { User },
} = require('./db')
const path = require('path')

app.use(morgan('tiny'))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

const requireToken = async (req, res, next) => {
	try {
		const token = req.headers.authorization
		const user = await User.byToken(token)
		req.user = user
		next()
	} catch (error) {
		next(error)
	}
}

app.post('/api/auth', async (req, res, next) => {
	try {
		const user = await User.authenticate(req.body)
		if (!user) res.sendStatus(404)
		const token = await jwt.sign({ id: user }, process.env.JWT)
		res.send({ token })
	} catch (ex) {
		next(ex)
	}
})

app.get('/api/auth', async (req, res, next) => {
	try {
		// res.send(await User.byToken(req.headers.authorization))
		const token = req.headers.authorization
		const user = await User.byToken(token)
		req.user = user
		res.send(req.user)
	} catch (ex) {
		next(ex)
	}
})

app.use((err, req, res, next) => {
	console.log(err)
	res.status(err.status || 500).send({ error: err.message })
})

module.exports = app
