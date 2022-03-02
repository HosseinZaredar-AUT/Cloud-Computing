import dotenv from 'dotenv'
dotenv.config()

import aws from '@aws-sdk/client-s3'
const { S3Client, ListObjectsCommand, PutObjectCommand } = aws

// Arvan Cloud client
const s3 = new S3Client({
    region: 'default',
    endpoint: 'https://s3.ir-thr-at1.arvanstorage.com',
    credentials: {
        accessKeyId: process.env.ARVAN_ACCESS_KEY_ID,
        secretAccessKey: process.env.ARVAN_SECRET_ACCESS_KEY,
    },
});

// list all the files in speech bucket
export async function listSpeech() {
    try {
        const response = await s3.send(
            new ListObjectsCommand({
                Bucket: 'first-hw-speeches',
            })
        );

        if (response.Contents)
            var contents = response.Contents.map(content => content.Key)
        else
            var contents = []
        
        return contents

    } catch (err) {
        console.log(err);
    }
}


// upload a speech in the specified bucket
export async function uploadSpeech(stream, name) {
    
    const uploadParams = {
        Bucket: 'first-hw-speeches',
        Key: name,
        ACL: 'public-read',
        Body: stream,
    };

    try {
        await s3.send(new PutObjectCommand(uploadParams));
        console.log('upload successful');
    } catch (err) {
        console.log(err);
    }

}