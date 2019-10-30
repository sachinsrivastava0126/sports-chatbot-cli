'use strict';

const GOOGLE_NEWS_API_BASE_URL = 'https://newsapi.org/v2/';
const GOOGLE_NEWS_API_KEY = 'e4c8bfe9aacf4ec0982da7220a8ca021';

const
  request = require('request');

var colors = require('colors');




// Get process.stdin as the standard input object.
let standard_input = process.stdin;

// Set input character encoding.
standard_input.setEncoding('utf-8');

// Prompt user to input data in console.
console.log("Hey Sports Fan, I'm a dumb bot! Ask me stuff.");

// When user input data and click enter key.
standard_input.on('data', function (data) {

    // User input exit.
    if(data === 'exit\n'){
        // Program exit.
        console.log("User input complete, program exit.");
        process.exit();
    }else
    {
        

        let team = data.split('the ')[1].split(' ')[0];

        request({
                 "url": `${GOOGLE_NEWS_API_BASE_URL}top-headlines?apiKey=${GOOGLE_NEWS_API_KEY}&country=us&category=sports&pageSize=1&q=`+team,
                 "method": "GET"
             }, (err, res, body) => {

                let articles = JSON.parse(body).articles;

                 if (articles.length > 0) {
                    let messageText = JSON.parse(body).articles[0].content.split(' [')[0].brightWhite.bgBlue;
                    let messageURL = JSON.parse(body).articles[0].url.underline.brightRed;

                    console.log("\n\nCHECK IT OUT:".green.bold+"\n"+messageURL+"\n"+messageText+"\n^Read more at link above^\n".zebra+"\n\n");
                    
                } else {
                    console.log("\n\n"+"Hmm...I'm pretty dumb so I didn't find anything recent on the ".white.bold.bgRed+team.white.bold.bgRed+". Try asking Google!".white.bold.bgRed+"\n\n");
                     
                }
               


               

                 

                 if (err){
                     console.log("News API Error: ", err);
                 }

        });
    }
});


// checks what kind of query user has entered and returns some corresponding identifier
function checkQueryType (q) {
    
}

// extracts team name from string and returns it (string)
function extractTeamName(s) {

}

// gets score given a team and returns json object containing it/game info
function getTeamScore(team) {


}

// checks if there is a game on for given team and returns true if so else false
function checkGameOn(team) {

}


// gets latest news for a team and returns json object containing said news info
function getTeamNews(team) {


}




