const WPAPI = require('wpapi');
const { Configuration, OpenAIApi } = require('openai');
var moment = require('moment');
const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config()

const postToPFP = async (title, con) =>{


   

    const wp = new WPAPI({ endpoint: process.env.PFPWEBURL });

  try {
    // Authenticate using cookies
    await wp.auth({
      username: process.env.PFPUSER,
      password: process.env.PFPPASSWORD
    });

    // Successfully authenticated
    // You can now make authenticated requests
    const response = await wp.posts().create({
      title: title,
      content: con,
      status: 'publish'
    });

    console.log('Post created:', response);

    return response.link
  } catch (error) {
    console.error('Error:', error);
  }



}


const listBlogPost = async () =>{

    const wp = new WPAPI({ endpoint: process.env.PFPWEBURL });

    try {
      // Authenticate using cookies
      await wp.auth({
        username: process.env.PFPUSER,
        password: process.env.PFPPASSWORD
      });



      let allPosts = [];
      let currentPage = 1;
      let totalPages = 1;
    
      while (currentPage <= totalPages) {
        const posts = await wp.posts().page(currentPage).perPage(100).get();
        allPosts = allPosts.concat(posts);
        totalPages = parseInt(posts._paging.totalPages);
        currentPage++;
      }
    
      console.log(allPosts);




  
      // Successfully authenticated
      // You can now make authenticated requests
      // const response = await wp.posts().get();
  
      // console.log('Post List:', response[0].title.rendered);
  
      return allPosts
    } catch (error) {
      console.error('Error:', error);
    }

}



async function gpt3(stext) {
    const api_key = process.env.OPENAIKEY;

    const configuration = new Configuration({
        organization: process.env.OPENAIORG,
        apiKey: api_key,
    });
    const openai = new OpenAIApi(configuration);

    // const completion = await openai.createChatCompletion({
    //     model: "gpt-3.5-turbo",
    //     messages: [{role: "user", content: "Hello world"}],
    // });
    // console.log(completion.data.choices[0].message);
    

    const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: stext }
    ];
    
  
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n:1 
    });

    console.log("here")

    // console.log(response.choices)
  
    const content = response.data.choices[0].message.content;

    // console.log(content, "Content")


    return content;
}



function capitalizeTitle(title) {
    const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];
    
    const words = title.toLowerCase().split(' ');
    const capitalizedWords = words.map((word, index) => {
      if (index === 0 || !smallWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      } else {
        return word;
      }
    });
    
    return capitalizedWords.join(' ');
}




const writeNewBlog = async (topic) =>{
      // `write blog sections\nblog topic: ${query}`

  try{

    const outline = await gpt3(`write me a list blog post subtitles for a blog post titled:\n ${topic}`);
      

      // const sections = await breakSection(outline)
    const sections = outline.split('\n')
    console.log(sections)
  
    console.log("in write Blog")

  
    const blog = []
  
    for(let i = 0; i<sections.length; i++){

      let newString = sections[i].substring(3)
      const prompt = await gpt3(`write a blog post section for:\n ${newString}`)
      blog.push(`<h3>${newString}</h3>\n${prompt}`)

      console.log(blog)

    }
  
    const concatenatedString = blog.join("\n");

    console.log(concatenatedString, "End of Concat ");

    const post = await postToPFP(capitalizeTitle(topic), concatenatedString)

  }catch(err){
    console.log(err)
  }
  
    // return blog

}


const listsToBePosted = async () =>{
    try{
        const doc = new GoogleSpreadsheet(process.env.GOOOGLESHEETID)
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLEEMAIL,
            private_key: process.env.GOOGLEPK.replace(/\\n/g, "\n"),
        });
        
        
        await doc.loadInfo();
        
        const firstSheet = await doc.sheetsByIndex[0]
      
        const numRows = await firstSheet.rowCount;
        // const range = `A2:Z${numRows}`;
        // console.log(range)
      
        const col = await firstSheet.getRows()
        console.log(col)
        const chekc = []
        let i = 0;
      
        while(i < col.length){
            if(col[i]["Posted"] !== "Yes"){
              console.log(col[i]["Keywords"])
              chekc.push({index: i, title: col[i]["Keywords"]})              
            }
          i++
        }
      
      
        const selectedNumbers = chekc.slice(0, 5); // Send message to first 5 numbers in the list
        console.log(selectedNumbers)
        return chekc
    }catch(err){
        console.log(err)
    }

}



const googleSheetIntegration = async () =>{
    // await checkIfPostEditGoogle()
    
    try{
      const doc = new GoogleSpreadsheet(process.env.GOOOGLESHEETID)
      await doc.useServiceAccountAuth({
          client_email: process.env.GOOGLEEMAIL,
          private_key: process.env.GOOGLEPK.replace(/\\n/g, "\n"),
      });
      
      
      await doc.loadInfo();
      
      const firstSheet = await doc.sheetsByIndex[0]
    
      const numRows = await firstSheet.rowCount;
      // const range = `A2:Z${numRows}`;
      // console.log(range)
    
      const col = await firstSheet.getRows()
      console.log(col)
      const chekc = []
      let i = 0;
    
      while(i < col.length){
          if(col[i]["Blog"] !== "Yes"){
            console.log(col[i]["Keywords"])
            chekc.push({index: i, title: col[i]["Keywords"]})              
          }
        i++
      }
    
    
      const selectedNumbers = chekc.slice(0, 5); // Send message to first 5 numbers in the list
      console.log(selectedNumbers)
      selectedNumbers.forEach(async number => {
  
        const post = await writeNewBlog(number.title)
    
    
        await firstSheet.loadCells();
        const cell = await firstSheet.getCell(number.index+1, 1 )
        cell.value = "Yes";
    
        const today = moment();
        const formattedDate = today.format('MM/DD/YY');
        const date = await firstSheet.getCell(number.index+1, 2)
        date.value = formattedDate
    
        await firstSheet.saveUpdatedCells();
      })
  
  
    }catch(err){
      console.log(err)
    }
    
  
}





const checkIfPostEditGoogle = async () =>{
    const blogs = await listBlogPost()
  
    console.log(blogs.length)
  
    const doc = new GoogleSpreadsheet(process.env.GOOOGLESHEETID)
  
    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLEEMAIL,
        private_key: process.env.GOOGLEPK.replace(/\\n/g, "\n"),
    });
    
    
    await doc.loadInfo();
    
    const firstSheet = await doc.sheetsByIndex[0]
  
  
    const col = await firstSheet.getRows()

    console.log(col.length)
    const chekc = []
    let j = 0;
  
    while(j < col.length){
      if(col[j]["Posted"] === "Yes"){
        chekc.push({index: j, title: col[j]["Keywords"]})              
      }             
      j++
    }
  
    console.log(chekc.length)
  
    const onBlog = []
    for(let i = 0; i<blogs.length; i++){
  
      onBlog.push(blogs[i].title.rendered.toLowerCase())
    }
  
  
    console.log(onBlog)
  
    for(let k = 0; k < chekc.length; k++ ){
      if (onBlog.includes(chekc[k].title)) {
        console.log(`${chekc[k].title} is in the list.`);
        await firstSheet.loadCells();
        const cell = await firstSheet.getCell(chekc[k].index+1, 3 )
        cell.value = "Yes";
        await firstSheet.saveUpdatedCells();
      } else {
        console.log(`${chekc[k].title} is not in the list.`);
      }
    }
  
  
}



const postOne = async (title, index) =>{

    const doc = new GoogleSpreadsheet(process.env.GOOOGLESHEETID)
  
    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLEEMAIL,
        private_key: process.env.GOOGLEPK.replace(/\\n/g, "\n"),
    });
    
    
    await doc.loadInfo();
    
    const firstSheet = await doc.sheetsByIndex[0]

    const post = await writeNewBlog(title)
    
    
    await firstSheet.loadCells();
    const cell = await firstSheet.getCell(index+1, 1 )
    cell.value = "Yes";

    const today = moment();
    const formattedDate = today.format('MM/DD/YY');
    const date = await firstSheet.getCell(index+1, 2)
    date.value = formattedDate

    await firstSheet.saveUpdatedCells();

}




/// This is the Menopause testing section


const writeNewBlogMenopasue = async (topic) =>{
  // `write blog sections\nblog topic: ${query}`

    try{

    const outline = await gpt3(`write me a list blog post subtitles for a blog post titled:\n ${topic}`);
      

      // const sections = await breakSection(outline)
    const sections = outline.split('\n')
    console.log(sections)

    console.log("in write Blog")


    const blog = []

    for(let i = 0; i<sections.length; i++){



      let newString = sections[i].substring(3)
      const prompt = await gpt3(`write a blog post section for:\n ${newString}`)

      if(i == 0 ){
        blog.push(`<h3>${newString}</h3>\n${prompt}\n
        <div style="background-color: #7371fc; width: 100%; max-width: 100%; height: 200px; display: flex; justify-content: center; align-items: center; flex-direction: column; color: white; border-radius: 10px;">
        <h1 style="font-size: 24px; text-align: center; margin-bottom: 20px; color: white;">Discover the Game-Changer for Menopause Relief We Absolutely Swear By! 💜👉</h1>
        <a class="button" style="background-color: #ffffff; color: #0099cc; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; text-decoration: none; text-align: center; transition: background-color 0.3s ease;" href="https://www.amazon.com/Joylux-Intimate-Wellness-Menopausal-Hydration/dp/B0B42KYZ98/ref=sr_1_2?crid=2BWFVE6LJ915G&amp;keywords=joylux&amp;qid=1697663400&amp;sprefix=joylux%252Caps%252C212&amp;sr=8-2&amp;_encoding=UTF8&amp;tag=pfp007-20&amp;linkCode=ur2&amp;linkId=5175162db2555222819ca88639b6316a&amp;camp=1789&amp;creative=9325" target="_blank" rel="noopener">Learn More</a>
        </div>
        `)
      }else{
        blog.push(`<h3>${newString}</h3>\n${prompt}`)
      }


      

      console.log(blog)

    }

    const concatenatedString = blog.join("\n");

    console.log(concatenatedString, "End of Concat ");

    const post = await postToPFP(capitalizeTitle(topic), concatenatedString)

    }catch(err){
    console.log(err)
    }

// return blog

}


const postOneMenopause = async (title, index) =>{

  const doc = new GoogleSpreadsheet(process.env.GOOOGLESHEETID)

  await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLEEMAIL,
      private_key: process.env.GOOGLEPK.replace(/\\n/g, "\n"),
  });
  
  
  await doc.loadInfo();
  
  const firstSheet = await doc.sheetsByIndex[2]

  const post = await writeNewBlogMenopasue(title)
  
  
  await firstSheet.loadCells();
  const cell = await firstSheet.getCell(index+1, 1 )
  cell.value = "Yes";

  const today = moment();
  const formattedDate = today.format('MM/DD/YY');
  const date = await firstSheet.getCell(index+1, 2)
  date.value = formattedDate

  await firstSheet.saveUpdatedCells();

}





const listsToBePostedMenopause = async () =>{
  try{
      const doc = new GoogleSpreadsheet(process.env.GOOOGLESHEETID)
      await doc.useServiceAccountAuth({
          client_email: process.env.GOOGLEEMAIL,
          private_key: process.env.GOOGLEPK.replace(/\\n/g, "\n"),
      });
      
      
      await doc.loadInfo();
      
      const firstSheet = await doc.sheetsByIndex[2]
    

      const numRows = await firstSheet.rowCount;
      // const range = `A2:Z${numRows}`;
      console.log(numRows)
    
      const col = await firstSheet.getRows()
      console.log(col)
      const chekc = []
      let i = 0;
    
      while(i < col.length){
          if(col[i]["Posted"] !== "Yes"){
            console.log(col[i]["Keywords"])
            chekc.push({index: i, title: col[i]["Keywords"]})              
          }
        i++
      }
    
    
      const selectedNumbers = chekc.slice(0, 5); // Send message to first 5 numbers in the list
      console.log(selectedNumbers)
      return chekc
  }catch(err){
      console.log(err)
  }

}





module.exports = {
    googleSheetIntegration,
    checkIfPostEditGoogle,
    listsToBePosted,
    listsToBePostedMenopause,
    postOne,
    postOneMenopause
}

