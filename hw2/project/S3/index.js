import express from 'express'
import fetch from 'node-fetch'

import config from './config.js'

const app = express()
const port = config.port

app.get('/', async function(req, res) {
    
    const response = await fetch(config.time_api)
    const data = await response.json()
    res.json({
        "hostname": 'hossein',
        "time": data
    })

})

app.listen(port, () => {
    console.log(`app listening at ${port}`)
})