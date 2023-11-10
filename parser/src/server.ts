import express, { response } from 'express';
import * as https from 'https';
import * as fs from 'fs';
import cors from 'cors'
import mongoose from 'mongoose';
import { Post, ResponseDataModel } from './models/postSchema';
import { last } from 'cheerio/lib/api/traversing';


const app = express();

// Загрузка SSL-сертификата и ключа
const privateKey = fs.readFileSync('./localhost.key', 'utf8');
const certificate = fs.readFileSync('./localhost.crt', 'utf8');

const credentials: https.ServerOptions = { key: privateKey, cert: certificate };
const db = 'mongodb+srv://meshok:meshok123@posts.bltx7d0.mongodb.net/?retryWrites=true&w=majority'

const oneDayMilliseconds = 24 * 60 * 60 * 1000;
let lastClearDate: number = 0

mongoose
  .connect(db)
  .then((res)=>{
    console.log('Connected to db')
  })
  .catch((err)=>{
    console.log(err)
  })


app.use(cors())
app.use(express.json())

// Настройка Express приложения
app.get('/', async (req, res) => {
  res.send('заходи на localhost/json');
});

app.post('/json', async (req, res) => {
  await WriteDataBase(req,res)
});

// Создание HTTPS сервера
const httpsServer = https.createServer(credentials, app);

const port = 443; // Порт для HTTPS

httpsServer.listen(port, '0.0.0.0',() => {
  console.log(`HTTPS сервер запущен на порту ${port}`);
});



const WriteDataBase = async (req,res) => {
  const postData: Post = req.body
  const postSchema = new ResponseDataModel(postData)
  const curDate = Date.now()
  //очищаем бд от постов позже 5 дней
  if(curDate - lastClearDate > 5 * oneDayMilliseconds){
    await ResponseDataModel.deleteMany({'data.article.create_at': { $lt: curDate - 5 * oneDayMilliseconds }})
    lastClearDate = Date.now()
  }
  await postSchema
    .save()
    .then((response)=>{ 
      res.send(response)
      console.log('Данные записаны')
    })
    .catch((error)=>{ console.log(error)})
}