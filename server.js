
const express = require('express');
const app = express();
const cron = require('node-cron');
require('dotenv').config()
const {    
    googleSheetIntegration,
    checkIfPostEditGoogle
} = require('./helper/helpers')
const cors = require('cors');


cron.schedule('*/30 * * * *', async () => {
    console.log("every thirty min")

    await checkIfPostEditGoogle()
    await googleSheetIntegration()


})


app.use(cors());


app.route('/test').get(async (req,res)=>{
    await checkIfPostEditGoogle()
    await googleSheetIntegration()

})


const port = process.env.PORT || 3001

app.listen(port, () =>{
    console.log('SERVER RUNNING', port)
})