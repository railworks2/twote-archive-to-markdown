# Twote Archive to Markdown

This is a simple Node.js script that converts a Twitter archive to Markdown files.

## How to use:

1. Run `npm install` to install the dependencies.
2. Unzip your Twitter archive
3. Find `tweet.js` in the data folder of your Twitter archive and copy it to the root of this project.
3. Open `tweet.js` and remove `window.YTD.tweets.part0 =` from the top of the file.
4. Rename `tweet.js` to `tweets.json`.
5. Open `index.js` and change the `config` object to match your choices. Being sure to change the `username` to your Twitter username.
6. Run `npm start` to start the script.
7. If there are any errors, check the console for more information.

After you're done, move the newly created `files` to wherever you need. All of the media you'll need to move is in the `data/tweets_media` folder.

## Notes:

- By default, this Tweet will save as many tweets as possible. 
    - If a tweet is in reply to another tweet, it will save the original tweet and the reply as a single file.
    - If a tweet is in reply to another but the previous doesn't exist, it'll be added to the retry list.
    - If it is not possible to save a tweet, it will be skipped and logged to the output. You may need to manually resolve this.
- x.com links and mentions will be converted to twitter.com links