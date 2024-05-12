const express = require('express');
const app = express();
require('dotenv').config();
const axios = require('axios');

const line = require ('@line/bot-sdk')

const config ={
    channelAccessToken: process.env.ChannelAccessToken,
    channelSecret: process.env.ChannelSecret
}

app.post('/webhook',line.middleware(config), (req,res) => {
    Promise
        .all([
            req.body.events.map(handleEvent)
        ])
        .then((result) => res.json(result))
});

const client = new line.Client(config);

async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    const word = event.message.text.trim().toLowerCase();

    try {
        const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const meanings = response.data[0].meanings;

        let replyMessage = '';
        meanings.forEach((meaning) => {
            if (meaning.partOfSpeech === 'noun' || meaning.partOfSpeech === 'verb') {
                const partOfSpeech = meaning.partOfSpeech.charAt(0).toUpperCase() + meaning.partOfSpeech.slice(1); // Capitalize part of speech
                replyMessage += `■ ${partOfSpeech}: ${meaning.definitions[0].definition}\n`;

                // Check if synonyms exist
                if (meaning.definitions[0].synonyms.length > 0) {
                    replyMessage += `Synonyms: ${meaning.definitions[0].synonyms.join(', ')}\n`;
                }
                
                replyMessage += '\n'; // Add line break between each part of speech
            }
        });

        if (replyMessage === '') {
            replyMessage = 'ไม่พบคำที่คุณค้นหา';
        }

        await client.replyMessage(event.replyToken, { type: 'text', text: replyMessage });
    } catch (error) {
        console.error('Error fetching definition:', error);
        await client.replyMessage(event.replyToken, { type: 'text', text: 'เกิดข้อผิดพลาดในการค้นหาคำ' });
    }
}


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});