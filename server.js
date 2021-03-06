require('dotenv').config()
const express = require('express')
const cors = require('cors')

const PORT = 3000
const server = express()
server.use(cors())
server.use(express.json())

server.use('/', require('./router'))

server.listen(PORT, () => console.log('Lukkari Server running on port ' + PORT))