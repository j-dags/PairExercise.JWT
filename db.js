const jwt = require('jsonwebtoken')
const Sequelize = require('sequelize')
const bcrypt = require('bcrypt')
const { STRING } = Sequelize
const config = {
	logging: false,
}

if (process.env.LOGGING) {
	delete config.logging
}
const conn = new Sequelize(
	process.env.DATABASE_URL || 'postgres://localhost/acme_db',
	config
)

const User = conn.define('user', {
	username: STRING,
	password: STRING,
})

User.byToken = async (token) => {
	try {
		console.log('INCOMING TOKEN ~~~>', token)
		// verify = decrypt token
		const payload = await jwt.verify(token, process.env.JWT)

		const user = await User.findByPk(payload.id)
		if (user) {
			console.log('Deserialized Payload ~~~~>', payload)
			return user
		}
		const error = Error('byToken: BAD CREDENTIAL')
		error.status = 401
		throw error
	} catch (ex) {
		const error = Error('byToken: BAD CREDENTIAL')
		error.status = 401
		throw error
	}
}

User.authenticate = async ({ username, password }) => {
	const user = await User.findOne({
		where: {
			username,
		},
	})
	const match = await bcrypt.compare(password, user.password)
	if (match) {
		return user.id
	}
	const error = Error('bad credentials')
	error.status = 401
	throw error
}

User.beforeCreate(async (user) => {
	user.password = await bcrypt.hash(user.password, 3)
})

const syncAndSeed = async () => {
	await conn.sync({ force: true })
	const credentials = [
		{ username: 'lucy', password: 'lucy_pw' },
		{ username: 'moe', password: 'moe_pw' },
		{ username: 'larry', password: 'larry_pw' },
	]
	const [lucy, moe, larry] = await Promise.all(
		credentials.map((credential) => User.create(credential))
	)
	return {
		users: {
			lucy,
			moe,
			larry,
		},
	}
}

module.exports = {
	syncAndSeed,
	models: {
		User,
	},
}
