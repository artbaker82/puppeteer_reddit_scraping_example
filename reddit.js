const puppeteer = require("puppeteer");

const SUBREDDIT_URL = (reddit) => `https://old.reddit.com/r/${reddit}/`;

const self = {
  browser: null,
  page: null,

  initialize: async (reddit) => {
    self.browser = await puppeteer.launch({
      // headless: false,
      defaultViewport: null,
    });
    self.page = await self.browser.newPage();

    await self.page.goto(SUBREDDIT_URL(reddit), {
      waitUntill: "networkidle0",
    });
  },

  getResults: async (nr) => {
    let results = [];

    do {
      let newResults = await self.parseResults();
      results = [...results, ...newResults];

      if (results.length < nr) {
        let nextPageButton = await self.page.$("#siteTable > div.nav-buttons > span > span > a");

        if (nextPageButton) {
          Promise.all([
            await nextPageButton.click(),
            await self.page.waitForNavigation({ waitUntill: "networkidle0" }),
          ]);
        } else {
          break;
        }
      }
    } while (results.length < nr);
    return results.slice(0, nr);
  },

  parseResults: async () => {
    // "#siteTable > div[class *= 'thing']" is the same as "#siteTable > div.thing
    //query each div containing individual posts

    //$$ selector runs querySelectorAll
    let elements = await self.page.$$("#siteTable > div[class *= 'thing']");

    let results = [];
    for (let element of elements) {
      let title = await element.$eval("p[class='title']", (node) => node.innerText.trim());
      let rank = await element.$eval("span.rank", (node) => node.innerText.trim());
      let postTime = await element.$eval("div.top-matter > p.tagline > time", (node) =>
        node.innerText.trim()
      );
      let comments = await element.$eval("div.top-matter > ul > li.first > a", (node) =>
        node.innerText.trim()
      );
      let authorUrl = await element.$eval("div.top-matter > p.tagline > a", (node) =>
        node.href.trim()
      );
      let authorName = await element.$eval("div.top-matter > p.tagline > a", (node) =>
        node.innerText.trim()
      );
      let likes = await element.$eval("div.midcol.unvoted > div.score.likes", (node) =>
        node.innerText.trim()
      );

      results.push({
        title,
        rank,
        comments,
        postTime,
        authorUrl,
        authorName,
        likes,
      });
    }
    return results;
  },
};

module.exports = self;
