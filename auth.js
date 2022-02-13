require('dotenv').config()

const auth = (req, res, next) => {
    const basicAuthInB64 = (req.headers.authorization || '').substring(6)
    if (!basicAuthInB64) {
        return res.status(401).send('Authentication required') 
    }
    const basicAuth = Buffer.from(basicAuthInB64, 'base64').toString()
    const [username, password] = basicAuth.split(':')
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).send('Incorrect credentials')
    }
    next()
}

module.exports = auth