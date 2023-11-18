import mongoose from "mongoose";
import { Markup, Telegraf } from "telegraf";
import path, { resolve } from "path";
import * as dotenv from 'dotenv' 
import { Post } from "./models/postSchema";
import { InlineKeyboardButton, InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";
import { url } from "inspector";
import * as emoji from 'node-emoji';
import { send } from "process";
const envPath = resolve('.env')
dotenv.config({path: envPath})


const TELEGRAM_API_KEY = process.env.BOT_API_KEY
const DRAW_CHANNEL = process.env.DRAW_CHANNEL
const DB_ACCESS = process.env.DB_ACCESS

const bot = new Telegraf(TELEGRAM_API_KEY)
bot.launch()

const dayInSeconds: number = 24 * 60 * 60
const minuteInSeconds: number = 60
let lastTimeCheckSec: number = dbTime(Date.now()) - minuteInSeconds * 20
let lastDailyTop: number = 0
const minPrize: number = 10






const sendRewardMessages = async (posts) => {
    let i = 0
    while(i < posts.length){
        const post = posts[i]
        const postInfo = parsePostData(post)
        const textMessage =`*RawardPool:* ${parseFloat(postInfo.reward).toFixed(2)}$ \n_Interact to earn:_\n ${emoji.get('large_orange_diamond')}Trust, Comment, Repost${emoji.get('large_orange_diamond')}`
        let btnEmoji = getEmojiForReward(postInfo.reward)
        const textButton =  `${btnEmoji} ${postInfo.reward}$`
        const keyboard: InlineKeyboardMarkup = {
            inline_keyboard: [
              [
                { text: textButton, url: `https://debank.com/stream/${postInfo.id}?t=${Date.now()}&r=74835` },
              ],
            ]
        };
        await bot.telegram.sendMessage(DRAW_CHANNEL, textMessage, {
            reply_markup: keyboard,
            parse_mode: 'Markdown'
          })
        i++
        await delay(500)
    }
}

const sendTopMessage = async (postsArray) => {
    const now = new Date();
    const utcDay = now.getUTCDate();
    const utcMonth = now.getUTCMonth() + 1;
    const utcYear = now.getUTCFullYear();

    let messageText = `<b>\u{1F6A8}TOP RewardPools${emoji.get('bangbang')}</b> <i><u>${utcDay}.${utcMonth}.${utcYear}</u></i>`
    let btnArray=[]
    for(let i = 0; i < postsArray.length; i++){
        const post = postsArray[i]
        const btnEmoji = getEmojiForReward(post.reward)
        const postBtn:InlineKeyboardButton = { text: `${btnEmoji} ${parseFloat(post.reward).toFixed(2)}$`, url: `https://debank.com/stream/${post.id}?t=${Date.now()}&r=74835`}
        btnArray.push([postBtn])
    }

    const msg = await bot.telegram.sendMessage(DRAW_CHANNEL,messageText, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: btnArray
        }
    })

    await bot.telegram.pinChatMessage(DRAW_CHANNEL,msg.message_id)
    
    
}





const dbChecker = async () => {
    await mongoose
    .connect(DB_ACCESS)
    .then((res)=>{
      console.log('Connected to db', getTimestamp())
    })
    .catch((err)=>{
      console.log(err)
    })

    setInterval(async () => {
        const currentTime = dbTime(Date.now())
        if(currentTime - lastTimeCheckSec > minuteInSeconds){
            const rewardPosts = await Post.find({
                'data.article.reward_usd_value' : {$gte : minPrize},
                'data.article.create_at': {$gt : lastTimeCheckSec}
            })
            rewardPosts.map(async post => {
                let postPrize = post.data.article.reward_usd_value
                let postId = post.data.article.id
                console.log(postId,postPrize)
            })
            console.log('\nПулов найдено:'+rewardPosts.length, getTimestamp())
            
            rewardPosts.length > 0 ? lastTimeCheckSec = rewardPosts[rewardPosts.length - 1].data.article.create_at : {}

            await sendRewardMessages(rewardPosts) 
        }

        if(currentTime - lastDailyTop > 12*60*60){ //поменять на раз в сутки
            await sendDailyTopPools()
            lastDailyTop = currentTime
        }  
        console.log('\nЖдем еще минутку',getTimestamp())
        
        
    }, minuteInSeconds  * 1000)
}

const sendDailyTopPools = async () => {
    let postsArray = []
    const rewardPosts = await Post.find({
        'data.article.reward_usd_value' : {$gte : minPrize},
        'data.article.create_at': {$gt : lastDailyTop - 2 * dayInSeconds}
        })
        .sort({'data.article.reward_usd_value': -1})
        .limit(10)
    console.log("\nТоп посты найдены", getTimestamp())
    rewardPosts.forEach(post => {
        const parsedPost  = parsePostData(post)
        postsArray.push(parsedPost)
    })
    await sendTopMessage(postsArray)
}

function getTimestamp(){
var currentDate = new Date();
var day = currentDate.getDate();
var month = currentDate.getMonth() + 1;
var year = currentDate.getFullYear();

// Получаем текущее время
var hours = currentDate.getHours();
var minutes = currentDate.getMinutes();
var seconds = currentDate.getSeconds();
var miliSeconds = currentDate.getMilliseconds();
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}:${miliSeconds}`
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function dbTime(timeMillisecond: number) {
    return timeMillisecond/1000
}

const parsePostData = (RawPost) => {
    const data = RawPost.data.article
    const postInfo = {
        id: data.id,
        reward: data.reward_usd_value,
        creationDate: data.create_at,
        endtime: data.create_at + 3 * dayInSeconds
    }
    return postInfo
}
function getEmojiForReward(reward) {
    let btnEmoji = emoji.get('gift')
    if(reward >= 50){
        btnEmoji = emoji.get('money_with_wings')
    }
    if(reward >= 100){
        btnEmoji = emoji.get('gem')
    }
    if(reward >= 500){
        btnEmoji = emoji.get('fire')
    }
    return btnEmoji
}

dbChecker()