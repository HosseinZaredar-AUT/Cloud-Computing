import dotenv from 'dotenv'
dotenv.config()

import pg from 'pg';
const { Client } = pg;

// connecting to db
const client = new Client({
  user: 'postgres',
  host: 'first-hw-pgsql',
  database: 'database',
  password: process.env.DB_PASS,
  port: 5432,

//   user: 'hossein',
//   host: 'localhost',
//   database: 'database',
//   password: process.env.DB_PASS,
//   port: 5432
})
client.connect()

// reset the database
export async function resetDatabase() {

    try {

        // dropping tables
        await client.query('DROP TABLE IF EXISTS story')
        await client.query('DROP TABLE IF EXISTS photo')
        await client.query('DROP TABLE IF EXISTS photo_comment')

        // create table 'story'
        await client.query(
            'CREATE TABLE story (\
            _id				serial,\
            story_content	text,\
            PRIMARY KEY (_id))')

        // create table 'photo'
        await client.query(
            'CREATE TABLE photo (\
            _id		serial,\
            url		text,\
            PRIMARY KEY (_id))')

        // create table 'photo_comment
        await client.query(
            'CREATE TABLE photo_comment (\
                _id				serial,\
                photo_id		int,\
                author			text,\
                comment_text	text,\
                PRIMARY KEY (_id))')


        // insert some data into 'story'
        await client.query(
            "INSERT INTO story(story_content) VALUES ('This is a simple story!');\
            INSERT INTO story(story_content) VALUES ('This is another simple story!');\
            INSERT INTO story(story_content) VALUES ('Dr Tomas Streyer looked around the control room at his team of scientists and engineers. He was excited and frightened but he tried to seem calm. In a few minutes, they might start to discover something amazing: how the universe began.\
            He looked out of the window at the beautiful blue summer sky and tried to breathe slowly.\
            Ready, he said. He pressed the first button and the complicated computers and machines came to life.')")

        // insert some data into 'photo'
        await client.query(
            "INSERT INTO photo(url) VALUES ('https://first-hw-images.s3.ir-thr-at1.arvanstorage.com/sample_1.jpg');\
            INSERT INTO photo(url) VALUES ('https://first-hw-images.s3.ir-thr-at1.arvanstorage.com/sample_2.jpg');\
            INSERT INTO photo(url) VALUES ('https://first-hw-images.s3.ir-thr-at1.arvanstorage.com/sample_3.jpg');")

    } catch (err) {
        console.log(err)
    }
    
}

export const dbClient = client