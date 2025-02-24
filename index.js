require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const routes=require('./router');

const app= express();

app.use(express.json());
app.use('/api',routes);

//mongo connection
mongoose.connect(process.env.DB_CONNECTION);
const db=mongoose.connection;
db.on('error',(err)=>console.log(err));
db.on("connected",()=>console.log('database connected'));

app.listen(3000,()=>{
    console.log('Server started in localhost 3000');
});