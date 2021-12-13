const reddit = require("./reddit");

(async () => {
  //the argument is the subreddit we want to scrape
  await reddit.initialize("node");

  let results = await reddit.getResults(100);
  console.log(results, results.length);
  await reddit.browser.close();
})();
