import dotenv from 'dotenv'
dotenv.config()

import fetch from 'node-fetch'

// IBM Cloud credentials
const ibm_url = process.env.IBM_NLU_URL
const ibm_key = process.env.IBM_NLU_KEY

// check if the text is considered an angry text
export async function checkAnger(text) {

    var response = await fetch(`${ibm_url}/v1/analyze?version=2019-07-12`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + new Buffer.from('apikey:'+ibm_key, 'binary').toString('base64')
        },
        body: JSON.stringify({
            "text": text,
            "features": {
                "keywords": {
                    "emotion": true
                }
            }
        })
    })


    var result = await response.json()
    
    var keywords = result.keywords
    var angry = false

    if (keywords) {

        for (const keyword of keywords) {
            if (keyword.emotion.anger > 0.5)
                angry = true
        }
    }

    return angry

}