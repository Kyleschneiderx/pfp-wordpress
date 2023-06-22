
const express = require('express');
const app = express();
const cron = require('node-cron');
require('dotenv').config()
const {    
    googleSheetIntegration,
    checkIfPostEditGoogle,
    listsToBePosted,
    postOne

} = require('./helper/helpers')
const cors = require('cors');


cron.schedule('*/30 * * * *', async () => {
    console.log("every thirty min")

    const klist = await listsToBePosted()

    const slice = klist.slice(0,7)

    for(let i=0; i<slice.length; i++){
        
        console.log(slice[i].title, slice[i].index)      
        await postOne(slice[i].title, slice[i].index)

    }


    // await checkIfPostEditGoogle()
    // await googleSheetIntegration()


})


cron.schedule('0 * * * *', async () => {
    console.log("every hour")


    await checkIfPostEditGoogle()
    // await googleSheetIntegration()


})


app.use(cors());

app.route('/test').get(async (req,res)=>{
    await checkIfPostEditGoogle()
    await googleSheetIntegration()

})


app.route('/make').get(async (req,res)=>{
    // await checkIfPostEditGoogle()
    await googleSheetIntegration()
    res.status(200).send('Success')
})

app.route('/check').get(async (req,res)=>{
    await checkIfPostEditGoogle()
    // await googleSheetIntegration()
    res.status(200).send('Success')
})


app.route('/new').get(async (req,res)=>{
    // await checkIfPostEditGoogle()

    const klist = await listsToBePosted()

    const slice = klist.slice(0,2)

    for(let i=0; i<slice.length; i++){
        
        console.log(slice[i].title, slice[i].index)      
        await postOne(slice[i].title, slice[i].index)

    }


    



    // await googleSheetIntegration()
    res.status(200).send('Success')
})



const port = process.env.PORT || 3001

app.listen(port, () =>{
    console.log('SERVER RUNNING', port)
})