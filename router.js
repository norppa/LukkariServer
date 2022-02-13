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
    res.status(200).send()
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
    const deleteMany = db.transaction((songs)=> {
        for (const song of songs) {
            const result = deleteSingle.run(song)
            if (result.changes !== 1) failure = true
        }
    })
    deleteMany(deletions)
    if (failure) res.status(500).send()
    res.send()
    
})

router.get('/export', (req, res) => {
    const songs = db.prepare('SELECT * FROM songs').all()
    const output = songs.map(song => song.title + '\n\n' + song.lyrics).join('\n\n')
    res.send(output)
})

router.post('/feedback', (req, res) => {
    console.log('/feedback')
    const { feedback, respondent} = req.body
    if (!feedback) return res.status(400).send('Empty feedback not allowed')
    const result = db.prepare('INSERT INTO feedback (feedback, respondent) VALUES (?,?)').run(feedback, respondent)
    if (result.changes !== 1) return res.status(500).send('Database failure')
    res.status(200).send()
})

module.exports = router