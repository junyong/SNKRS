import dotenv from 'dotenv';
import { chromium, Browser, Page, ElementHandle } from 'playwright';
import { Info } from './types';
import { Telegraf } from 'telegraf';
import schedule from 'node-schedule';
import dayjs from 'dayjs';
import getDb from './lowdb.js';

dotenv.config();

const host = 'https://www.nike.com';
const listUrl = '/kr/launch/?type=upcoming';
const db = getDb();

const telegramToken: string = process.env.TELEGRAM_TOKEN ?? '';
const channelId: string = process.env.TELEGRAM_CHANNEL_ID ?? '';
const bot = new Telegraf(telegramToken);

(async () => {
  console.log('start!');
  const rule = new schedule.RecurrenceRule();
  rule.tz = 'Asia/Seoul';
  rule.hour = 9;
  rule.minute = 0;
  schedule.scheduleJob(rule, async function () {
    console.log('scheduleJob - start!');
    await run();
  });
})();

async function telegramSendMessage(message: string) {
  bot.telegram.sendMessage(channelId, message, { parse_mode: 'HTML' });
}

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
        telegramSendMessage(
          `<b>${name}</b>\n<i>${date}</i>\n<a href="${link}">detail</a>`,
        );

        let applyDate = dayjs(date);
        applyDate = applyDate.subtract(5, 'm');

        const rule = new schedule.RecurrenceRule();
        rule.tz = 'Asia/Seoul';
        rule.year = applyDate.year();
        rule.month = applyDate.month();
        rule.date = applyDate.date();
        rule.hour = applyDate.hour();
        rule.minute = applyDate.minute();
        schedule.scheduleJob(rule, function () {
          telegramSendMessage(`<b>${name}</b>\ngo!!!!`);
        });
      }
    }
  }

  await page.close();
}
