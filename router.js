const router = require('express').Router()
const dbDirectory = process.env.NODE_ENV === 'production' ? 'databases/' : ''
const dbPath = 'db/lukkari.db'
const db = require('better-sqlite3')(dbPath)
const auth = require('./auth')

router.get('/', (req, res) => {
    const songs = db.prepare('SELECT * FROM songs').all()
    res.send(songs)
})

router.get('/login', auth, (req, res) => {
    res.send()
})

const setSongNumber = db.prepare('UPDATE songs SET number = ? WHERE id = ?')

router.post('/', auth, (req, res) => {
    const { title, lyrics } = req.body
    if (!title || !lyrics) {
        return res.status(400).send('Title and lyrics are mandatory')
    }

    const nextAvailableNumber = db.prepare('SELECT COUNT(*) AS c FROM songs').get().c + 1
    let number = nextAvailableNumber

    if (req.body.number) {
        number = Number(req.body.number)
        if (!Number.isInteger(number)) return res.status(400).send('Song number needs to be an integer')
        if (number < 1 || number > nextAvailableNumber) return res.status(400).send('Numbering starts from 1 and gaps are not allowed')
    }

    const addSong = db.transaction(() => {
        db.prepare('SELECT * FROM songs WHERE number >= ?').all(number)
            .forEach(song => setSongNumber.run(song.number + 1, song.id))

        const result = db.prepare('INSERT INTO songs (number, title, lyrics) VALUES (?,?,?)').run(number, title, lyrics)
        return result.lastInsertRowid
    })

    try {
        const lastInsertRowid = addSong()
        res.send({ id: lastInsertRowid, number, title, lyrics })
    } catch (error) {
        console.error(error)
        res.status(500).send(error.message)
    }
})



router.put('/', auth, (req, res) => {
    const { id, number, title, lyrics, cascade } = req.body
    if (!id) return res.status(400).send('Missing song id')
    if (!number && !title && !lyrics) return res.status(400).send('Missing title, lyrics or song number')

    const updateColumn = (column) => db.prepare(`UPDATE songs SET ${column} = ? WHERE id = ?`)
    const updateSong = db.transaction(() => {
        if (title) updateColumn('title').run(title, id)
        if (lyrics) updateColumn('lyrics').run(lyrics, id)
        if (number) {

            const newNumber = Number(number)
            const numberOfSongs = db.prepare('SELECT COUNT(*) AS c FROM songs').get().c
            if (!Number.isInteger(newNumber)) return res.status(400).send('Song number needs to be an integer')
            if (newNumber < 1 || newNumber > numberOfSongs) return res.status(400).send('Numbering starts from 1 and gaps are not allowed')

            const oldNumber = db.prepare('SELECT number FROM songs WHERE id = ?').get(id).number
            if (newNumber > oldNumber) {
                db.prepare('SELECT * FROM songs WHERE number > ? AND number <= ?').all(oldNumber, newNumber)
                    .forEach(song => setSongNumber.run(song.number - 1, song.id))
            }
            if (newNumber < oldNumber) {
                db.prepare('SELECT * FROM songs WHERE number < ? AND number >= ?').all(oldNumber, newNumber)
                    .forEach(song => setSongNumber.run(song.number + 1, song.id))
            }
            updateColumn('number').run(newNumber, id)
        }
    })

    try {
        updateSong()
        res.send()
    } catch (error) {
        console.error(error)
        res.status(500).send(error.message)
    }
})

router.delete('/', auth, (req, res) => {
    const deletions = req.body
    const deleteSingle = db.prepare('DELETE FROM songs WHERE id = @id')
    const deleteMany = db.transaction((songs) => {
        songs.forEach(song => deleteSingle.run(song))
        db.prepare('SELECT * FROM songs ORDER BY number').all()
            .forEach((song, i) => setSongNumber.run(i + 1, song.id))
    })

    try {
        deleteMany(deletions)
    } catch (e) {
        return res.status(500).send()
    }
    res.send()

})

router.post('/import', auth, (req, res) => {
    let songs = req.body.songs
    if (!Array.isArray(req.body.songs)) return res.status(400).send('Required input is an array of songs')
    if (songs.find(song => !song.title || !song.lyrics)) return res.status(400).send("Missing title(s) or lyrics")

    if (!req.body.ignoreNumbering) {
        songs = songs.sort((a, b) => (a.number || 0) - (b.number || 0))
        let previous = 0, temp = null
        for (let i = 0; i < songs.length; i++) {
            const number = songs[i].number
            if (!number) continue
            if (number == previous) return res.status(400).send('Invalid numbering')
            previous = number
            temp = songs[number - 1]
            songs[number - 1] = songs[i]
            songs[i] = temp
        }
    }

    const currentNumberOfSongs = db.prepare('SELECT COUNT(*) AS c FROM songs').get().c
    const addSong = db.prepare('INSERT INTO songs (number, title, lyrics) VALUES (@number, @title, @lyrics)')
    const addSongs = db.transaction(() => {
        songs.forEach(({ title, lyrics }, i) => {
            addSong.run({ number: currentNumberOfSongs + i + 1, title, lyrics })
        })
    })

    try {
        addSongs()
    } catch (error) {
        console.error(error)
        res.status(500).send(error.message)
    }
    res.send()
})

router.post('/feedback', (req, res) => {
    const { type, title, context, content } = req.body
    const result = db.prepare('INSERT INTO feedback (type, request_title, correction_song, feedback_content) VALUES (?,?,?,?)')
        .run(type, title, context, content)
    return res.send()
})

router.get('/feedback', auth, (req, res) => {
    const result = db.prepare('SELECT id, type, request_title AS title, correction_song AS context, feedback_content AS content FROM feedback').all()
    res.send(result)
})

router.delete('/feedback/:id', auth, (req, res) => {
    try {
        db.prepare('DELETE FROM feedback WHERE id=?').run(req.params.id)
    } catch (error) {
        res.status(500).send(error.message)
    }

    res.send()
})



module.exports = router