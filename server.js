
const express = require('express');
const app = express();
const cron = require('node-cron');
require('dotenv').config()
const {    
    googleSheetIntegration,
    checkIfPostEditGoogle,
    listsToBePosted,
    postOne,
    listsToBePostedMenopause,
    postOneMenopause

} = require('./helper/helpers')
const cors = require('cors');


cron.schedule('30 5 * * 1', async () => {
    console.log("5:30 AM every Monday")

    const klist = await listsToBePosted()

    const slice = klist.slice(0,7)

    for(let i=0; i<slice.length; i++){
        
        console.log(slice[i].title, slice[i].index)      
        await postOne(slice[i].title, slice[i].index)

    }


    // await checkIfPostEditGoogle()
    // await googleSheetIntegration()


})


cron.schedule('30 5 * * 1', async () => {
    console.log("5:30 AM every Monday")


    await checkIfPostEditGoogle()
    // await googleSheetIntegration()


})




cron.schedule('*/10 * * * *', async () => {
    console.log("every ten min")

    const klist = await listsToBePostedMenopause()

    const slice = klist.slice(0,7)

    console.log(slice)

    for(let i=0; i<slice.length; i++){
        
        console.log(slice[i].title, slice[i].index)      
        await postOneMenopause(slice[i].title, slice[i].index)

    }


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

    const klist = await listsToBePostedMenopause()

    const slice = klist.slice(0,2)

    console.log(slice)

    for(let i=0; i<slice.length; i++){
        
        console.log(slice[i].title, slice[i].index)      
        await postOneMenopause(slice[i].title, slice[i].index)

    }



    // await googleSheetIntegration()
    res.status(200).send('Success')
})



const port = process.env.PORT || 3001

app.listen(port, () =>{
    console.log('SERVER RUNNING', port)
})