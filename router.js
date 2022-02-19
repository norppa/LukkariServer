const router = require('express').Router()
const dbDirectory = process.env.NODE_ENV === 'production' ? 'databases/' : ''
const dbPath = dbDirectory + 'VLK.db'
const db = require('better-sqlite3')(dbPath)
const auth = require('./auth')

router.get('/', (req, res) => {
    const songs = db.prepare('SELECT * FROM songs').all()
    res.send(songs)
})

router.get('/login', auth, (req, res) => {
    res.send()
})

router.post('/', auth, (req, res) => {
    const { title, lyrics } = req.body
    if (!title || !lyrics) {
        return res.status(400).send('Title and lyrics are mandatory')
    }
    const result = db.prepare('INSERT INTO songs (title, lyrics) VALUES (?,?)').run(title, lyrics)
    if (result.changes !== 1) return res.status(500).send('Database failure')
    console.log('result', result)
    res.status(200).send({ id: result.lastInsertRowid, title, lyrics })
})

router.put('/:id', auth, (req, res) => {
    const { title, lyrics } = req.body
    if (!title || !lyrics) return res.status(400).send('Missing title or lyrics')
    const result = db.prepare('UPDATE songs SET title=?, lyrics=? WHERE id=?').run(title, lyrics, req.params.id)
    if (result.changes !== 1) return res.status(500).send('Database failure')
    res.status(200).send()
})

router.delete('/', auth, (req, res) => {
    const deletions = req.body
    let failure = false
    const deleteSingle = db.prepare('DELETE FROM songs WHERE id = @id')
    const deleteMany = db.transaction((songs) => {
        for (const song of songs) {
            const result = deleteSingle.run(song)
            if (result.changes !== 1) failure = true
        }
    })
    deleteMany(deletions)
    if (failure) res.status(500).send()
    res.send()

})

module.exports = router