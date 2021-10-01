import { chromium, Browser, Page, ElementHandle } from 'playwright';
import { Info } from './types';
import getDb from './lowdb.js';

const host = 'https://www.nike.com';
const listUrl = '/kr/launch/?type=upcoming';
const db = getDb();

(async () => {
  console.log('start!');
  console.log(db.data);

  await run();
})();

async function getText(item: ElementHandle, selector: string): Promise<string> {
  return await item.$eval(selector, (node: Element) => node.textContent ?? '');
}

async function run() {
  const browser: Browser = await chromium.launch({
    headless: false,
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
      const link: string = (await drawElement?.getAttribute('href')) as string;
      console.log(`${host}${link}`);
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
      }
    }
  }

  await page.close();
}
