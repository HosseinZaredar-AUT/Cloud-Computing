import dotenv from 'dotenv'
dotenv.config()

import express from 'express'

const app = express()
// const port = 8080
const port = 80

// express setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

// connect to database
import { dbClient, resetDatabase } from './models/db.js'

// text-to-speech service
import { processStories, addCommentSpeech } from './controllers/text_to_speech.js'

// NLU service
import { checkAnger } from './controllers/nlu.js'


var first_request = true

// home
app.get('/', async function(req, res) {

    if (first_request) {

        try {
            await resetDatabase()
            await processStories()
            first_request = false
            res.render('pages/home');
        } catch (e) {
            console.log('error in resetting database', e)
        }

    } else {
        res.render('pages/home');
    }
    
});

// stories page
app.get('/stories', async function(req, res) {

    try {

        var qres = await dbClient.query("SELECT * FROM story")
        var stories = qres.rows
        res.render('pages/stories', {
            stories: stories,
            speech_base_url: 'https://first-hw-speeches.s3.ir-thr-at1.arvanstorage.com'
        });

    } catch (err) {
        console.log(err)
    }

});

// photos page
app.get('/photos', async function(req, res) {

    try {
        var qres = await dbClient.query("SELECT * FROM photo")
        var photos = qres.rows

        var qres = await dbClient.query("SELECT * FROM photo_comment")
        var comments = qres.rows

        var setComments = new Promise((resolve) => {
            photos.forEach((photo, i, array) => {
                var photoComments = comments.filter(comment => comment.photo_id == photo._id)
                photo.comments = photoComments
                if (i === array.length - 1) resolve()
            })
        })

        await setComments
        res.render('pages/photos', {
            error: req.query.error,
            photos: photos,
            speech_base_url: 'https://first-hw-speeches.s3.ir-thr-at1.arvanstorage.com'
        });

    } catch(err) {
        console.log(err)
    }

});

// add a new comment under a photo
app.post('/photo_comment', async function(req, res) {

    try {
        var response = await checkAnger(req.body.comment)
        if (response) {
            res.redirect('/photos?error=true')
        } else {

            var qres = await dbClient.query(
                `INSERT INTO photo_comment(photo_id, author, comment_text)\
                 VALUES (${req.body.photo_id}, '${req.body.author}', '${req.body.comment}')`)
                
            var qres = await dbClient.query(
                'SELECT _id FROM photo_comment\
                ORDER BY _id DESC\
                LIMIT 1')

            var commentID = qres.rows[0]._id
            await addCommentSpeech(commentID, req.body.author, req.body.comment)

            res.redirect('/photos') 
        }

    } catch(err) {
        console.log(err)
    }
})

// listen at the specified port
app.listen(port, () => {
  console.log(`app listening at ${port}`)
})