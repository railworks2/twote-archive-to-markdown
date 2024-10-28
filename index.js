const tweets = require('./tweets.json')
const moment = require('moment')
const matter = require('gray-matter')
const fs = require('fs')

const config = {
  outputLocation: `${__dirname}/files`,
  username: "railworks2rblx",
  mediaLocation: "/assets/blog-media/tweets/"
}

let tweetData = new Map();
function formatTweet(tweet) {
  let fileText = tweet.full_text
  if (tweet.entities.urls) {
    for (const url of tweet.entities.urls) {
      fileText = fileText.replace(url.url, `[${url.display_url}](${url.expanded_url})`)
      fileText = fileText.replaceAll("/x.com/", "/twitter.com/")
      fileText = fileText.replaceAll(" x.com/", "twitter.com/")
    }
  }

  if (tweet.entities.extended_entities) {
    fileText += '\n'
    for (const mediaItem of tweet.entities.media) {
      const fileName = mediaItem.media_url_https.substring(mediaItem.media_url_https.lastIndexOf('/') + 1)
      fileText += `\n![](${config.mediaLocation}${tweet.id}-${fileName}){: width="75%" }`
      fileText = fileText.replace(mediaItem.url, "")
    }
  } else if (tweet.entities.media) {
    fileText += '\n'
    for (const mediaItem of tweet.extended_entities.media) {
      const fileName = mediaItem.media_url_https.substring(mediaItem.media_url_https.lastIndexOf('/') + 1)
      fileText += `\n![](${config.mediaLocation}${tweet.id}-${fileName}){: width="75%" }`
      fileText = fileText.replace(mediaItem.url, "")
    }
  }

  if (tweet.entities.user_mentions) {
    for (mention of tweet.entities.user_mentions) {
      fileText = fileText.replace(`@${mention.screen_name}`,
        `[@${mention.screen_name}](https://twitter.com/${mention.screen_name})`)
    }
  }

  return fileText
}


let retryTweets = [];

for (twote of tweets.reverse()) {
  const tweet = twote.tweet
  let fileText = formatTweet(tweet)

  const tweetTime = moment(tweet.created_at, "ddd MMM DD HH:mm:ss Z YYYY")
  if (tweet.in_reply_to_screen_name != config.username) {
    // Change below if you want to change the matter at the top of the Markdown file.
    const fileContent = matter.stringify(fileText, {
      layout: "tweet",
      date: tweetTime.format('YYYY-MM-DDTHH:MM:ssZ'),
      title: `Tweet @ ${tweetTime.format("DD/MM/YYYY HH:mm")} [${tweet.id}]`,
      stats: {
        likes: tweet.favorite_count ? tweet.favorite_count : null,
        retweets: tweet.retweet_count ? tweet.retweet_count : null
      },
    })
    const fileName = `${config.outputLocation}/${tweetTime.year()}/${tweetTime.format('YYYY-MM-DD')}-${tweet.id}.md` // Change here if you want to change the filename format.

    if (!fs.existsSync(`${config.outputLocation}/${tweetTime.year()}`)) {
      fs.mkdirSync(`${config.outputLocation}/${tweetTime.year()}`, { recursive: true });
    }

    fs.writeFileSync(fileName, fileContent)
    tweetData.set(tweet.id, {
      date: tweetTime.format('YYYY-MM-DD'),
      file: fileName
    })
  } else {
    if (tweetData.has(tweet.in_reply_to_status_id_str) && fs.existsSync(tweetData.get(tweet.in_reply_to_status_id_str).file)) {
      const existingTweet = fs.readFileSync(tweetData.get(tweet.in_reply_to_status_id_str).file)
      const newTweetContent = `\n${matter(existingTweet).content}\n\n---\n\n${fileText}`
      const fileContent = matter.stringify(newTweetContent, matter(existingTweet).data)
      fs.writeFileSync(tweetData.get(tweet.in_reply_to_status_id_str).file, fileContent)

      tweetData.set(tweet.id, {
        date: tweetTime.format('YYYY-MM-DD'),
        file: tweetData.get(tweet.in_reply_to_status_id_str).file,
        inReply: tweet.in_reply_to_status_id_str
      })
    } else {
      retryTweets.push({
        id: tweet.id,
        in_reply_to_status_id_str: tweet.in_reply_to_status_id_str,
        tweetDataState: tweetData.has(tweet.in_reply_to_status_id_str),
        tweetDataContent: tweetData.get(tweet.in_reply_to_status_id_str),
      })
    }
  }
}

let failedTweets = [];
retryTweets.forEach(tweet => {
  if (tweet.tweetDataState) {
    const existingTweet = fs.readFileSync(tweetData.get(tweet.in_reply_to_status_id_str).file)
    const newTweetContent = `\n${matter(existingTweet).content}\n\n---\n\n${fileText}`
    const fileContent = matter.stringify(newTweetContent, matter(existingTweet).data)
    fs.writeFileSync(tweetData.get(tweet.in_reply_to_status_id_str).file, fileContent)
  } else {
    console.log(`[WARN] Tweet ${tweet.id} in reply to ${tweet.in_reply_to_status_id_str} could not be saved. Data: ${JSON.stringify(tweet.tweetDataContent) || "No data"}`)
    failedTweets.push(tweet)
  }
})
console.log(`[INFO] ${tweetData.size} tweets processed. Failed with ${failedTweets.length} tweets. Retried ${retryTweets.length} tweets.`)
