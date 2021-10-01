import { chromium, Browser, Page, ElementHandle } from 'playwright';
import { Info } from './types';
import { Telegraf } from 'telegraf';
import schedule from 'node-schedule';
import getDb from './lowdb.js';

const host = 'https://www.nike.com';
const listUrl = '/kr/launch/?type=upcoming';
const db = getDb();

const telegramToken = '2021939179:AAGpH2RinLi482TgyNQItTGJs3orgZowCn0';
const channelId = '-1001370962829';
const bot = new Telegraf(telegramToken);

(async () => {
  console.log('start!');
  schedule.scheduleJob('0 9 * * *', async function () {
    console.log('scheduleJob - start!');
    await run();
  });
})();

async function getText(item: ElementHandle, selector: string): Promise<string> {
  return await item.$eval(selector, (node: Element) => node.textContent ?? '');
}

async function run() {
  const browser: Browser = await chromium.launch({
    headless: true,
  });
  const page: Page = await browser.newPage();
  await page.goto(`${host}${listUrl}`);

  const items: Array<ElementHandle> = await page.$$(
    'li.launch-list-item.d-md-ib ',
  );
  for await (const item of items) {
    const drawElement = await item.$('.ncss-btn-primary-dark');
    const value: string = (await drawElement?.innerText()) as string;
    if (value.trim().indexOf('THE DRAW') > -1) {
      const name: string = await getText(item, 'h6.headline-3');
      console.log(name);
      const link: string =
        host + ((await drawElement?.getAttribute('href')) as string);
      console.log(`${link}`);
      const date: string = (await item.getAttribute(
        'data-active-date',
      )) as string;
      console.log(date);
      const hasObject = db.data?.infos.find(
        (el) => el.name === name && el.date === date,
      );
      if (!hasObject) {
        const info: Info = {
          name,
          link,
          date,
        };
        db.data?.infos.push(info);
        db.write();
        bot.telegram.sendMessage(
          channelId,
          `<b>${name}</b>\n<i>${date}</i>\n<a href="${link}">go!</a>`,
          { parse_mode: 'HTML' },
        );
      }
    }
  }

  await page.close();
}
