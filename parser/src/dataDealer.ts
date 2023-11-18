import puppeteer from 'puppeteer-extra'
import { Browser, EvaluateFunc, LaunchOptions, Page, PuppeteerLaunchOptions } from 'puppeteer'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

import * as dotenv from 'dotenv'
import fs from 'fs'
import path, { resolve } from 'path'
import { error } from 'console'

const envPath = path.resolve('.env')
dotenv.config({path: envPath})

const existSelector = '#root > div > div.DesktopFrame_mainContainer__2V8Re > div.container_mainSubContainer__39U6P > div > div.DetailContainer_stream__2efLF > div > div > div > div:nth-child(1)'

let BROWSER : Browser;


const prodBrowserConfig: PuppeteerLaunchOptions = {
  headless: 'new',
  executablePath: '/usr/bin/google-chrome',
  args: ['--mute-audio', '--no-sandbox']
}

const devBrowserConfig: PuppeteerLaunchOptions = {
  headless: 'new',
  args: ['--mute-audio', '--no-sandbox']
}


const main = async (initialPostNumber: number) => {
  puppeteer.use(StealthPlugin())
  BROWSER = await puppeteer.launch(prodBrowserConfig);

  let currentPost: number = initialPostNumber;

  while(true){
    try{
      //40 постов для задерки выхода
      let POST100: number = currentPost + 70
      const isPost100Exist: boolean = await checkPostExist(POST100)
      if(isPost100Exist){
        console.log(currentPost, currentPost + 30)
  
        const page: Page = await BROWSER.newPage()
        await page.goto('https://debank.com/stream?q=draw&tab=search', {waitUntil: 'domcontentloaded'})
        await page.waitForSelector('.RichTextView_articleContent__2tMQD')
        await evaluateCode(page, currentPost)
        
        for(let i = 0; i < 30; i++){
          await page.click('.db-segmentedItem:not(.isActive)')
          await delay(1000)
          await page.waitForSelector('.RichTextView_articleContent__2tMQD')
          //сохраняем значение раз в 50 секунд
          if(i%15 == 0) fs.writeFileSync('lastPost.json', JSON.stringify({ currentPost }));
        }
        page.close()
        
        currentPost+=30
      }
      else{
        fs.writeFileSync('lastPost.json', JSON.stringify({ currentPost }));
        console.log('Сохранено значение curPost.');
        console.log('ждем 60 сек...')
        await delay(60000)
        continue
      }
    }
    catch(error){
      break;
    }
  }
}

const evaluateCode = async (page: Page, initialPost: number) => {
  console.log('выполняем')
  await page.evaluate((initialPost: number) => {
    let postId = initialPost
    const { fetch: originalFetch } = window;
    window.fetch = async (...args) => {
      let [resource, config] = args;

      if (resource.includes('https://api.debank.com/feed/search')) {
        const resp = await originalFetch(`https://api.debank.com/article?id=${postId}`, config);
        const json = await resp.json();
        fetch('https://mishkaserver.ddns.net:443/json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(json),
        })
        .then(response => response.json())
        .then(data => console.log('Ответ от сервера:', data))
        .catch(error => console.error('Ошибка:', error));

        postId++
           
      }
      const response = await originalFetch(resource, config);
      return response;
    };
  }, initialPost);
}



const checkPostExist = async (currentPost: number) => {
  const DownloadedSelector = '.DetailContainer_sidebar__2Bm9-'
  const Link = `https://debank.com/stream/${currentPost}`
  const checkPage: Page = await BROWSER.newPage()
  
  await enableOptimisation(checkPage)

  await checkPage.goto(Link)
  try{
    await checkPage.waitForSelector(DownloadedSelector, {timeout: 3000})
    return true
  }catch{
    const existElement = await checkPage.$(existSelector)
    const text = await checkPage.evaluate(element => element.textContent, existElement);
    if(text == 'This post has been hidden by the author'){
      return true
    } else{
      return false
    }
      
  }finally{
    await checkPage.close()
  }

}


const enableOptimisation = async (page:Page) => {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
      if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
          request.abort();
      } else {
          request.continue();
      }
  
    });
}

const delay = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function start() {
  while (true) {
    try{
      const path = resolve('lastPost.json')
      const jsonData = JSON.parse(fs.readFileSync(path, 'utf-8'));
      console.log('Данные из JSON файла:', jsonData);
      await main(jsonData.currentPost)
    }
    catch(error){
      console.log('Какая то херня, перезапускаем...')
    }
    
  }
}

start()