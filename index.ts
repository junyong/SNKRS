import { chromium, Browser, Page, ElementHandle } from 'playwright';

const host = 'https://www.nike.com';
const listUrl = '/kr/launch/?type=upcoming';

(async () => {
  console.log('start!');
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
    }
  }

  await page.close();
})();

async function getText(item: ElementHandle, selector: string): Promise<string> {
  return await item.$eval(selector, (node: Element) => node.textContent ?? '');
}
