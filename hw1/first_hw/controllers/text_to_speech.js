import dotenv from 'dotenv'
dotenv.config()

import fetch from 'node-fetch'

import stream from 'stream'
const { Readable } = stream

import { listSpeech, uploadSpeech } from './arvan.js'
import { dbClient } from '../models/db.js'

// IBM Cloud credentials
const ibm_url = process.env.IBM_T2S_URL
const ibm_key = process.env.IBM_T2S_KEY

// a function to turn buffer into stream
function bufferToStream(binary) {

    const readableInstanceStream = new Readable({
      read() {
        this.push(binary);
        this.push(null);
      }
    });

    return readableInstanceStream;
}

// turn text into speech
export async function textToSpeech(text) {
    
    const response = await fetch(ibm_url + '/v1/synthesize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'audio/wav',
            'Authorization': 'Basic ' + new Buffer.from('apikey:'+ibm_key, 'binary').toString('base64')
        },
        body: JSON.stringify({"text":text})
    });

    let buffer = await response.buffer()
    let file_stream = bufferToStream(buffer)

    return file_stream
}

// turn the stories in the database into speech and
// upload it in Object Storage (if they're already not)
export async function processStories() {

  try {

    var qres = await dbClient.query("SELECT * FROM story")
    var stories = qres.rows

    var speeches = await listSpeech()

    var process = new Promise((resolve) => {

      stories.forEach(async (story, i, array) => {

        var story_file = 's_' + story._id + '.wav'

          if (!speeches || !speeches.includes(story_file)) {
            var stream = await textToSpeech(story.story_content)
            await uploadSpeech(stream, story_file)
          }

          if (i === array.length - 1) resolve()

      })

    })

    await process

  } catch (e) {
    console.log(e)
  }

}

// turn a new comment into speech and upload it in Object Storage
export async function addCommentSpeech(commentID, author, commentText) {
  var stream = await textToSpeech(author + ': ' + commentText)
  await uploadSpeech(stream, `c_${commentID}.wav`)
}