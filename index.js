'use strict';


// Google News API Info
const GOOGLE_NEWS_API_BASE_URL = 'https://newsapi.org/v2/';
const GOOGLE_NEWS_API_KEY = 'e4c8bfe9aacf4ec0982da7220a8ca021';


// Google Custom Search API Info in Case We Need It
const GOOGLE_CUSTOM_SEARCH_API_BASE_URL = 'https://www.googleapis.com/customsearch/v1/';
const GOOGLE_CUSTOM_SEARCH_API_KEY = 'AIzaSyCUbWoXNZUiibhw49L0ZkrAby_Q8AiVDJw';
const GOOGLE_CUSTOM_SEARCH_ENGINE_ID = '010357174998574324875:z3qkqr1eegz';

const request = require('request');
const https = require('https');
const colors = require('colors');
// var allData = require('./data.json');
var firebase = require('firebase');


var config = {
    apiKey: "AIzaSyALnqLN4Xj59z_G5FwvpDjOL7cB9Od7moI",
    authDomain: "sports-chatbot-cli.firebaseapp.com",
    databaseURL: "https://sports-chatbot-cli.firebaseio.com",
    storageBucket: "sports-chatbot-cli.appspot.com"
};
firebase.initializeApp(config);

// Get a reference to the database service
var db = firebase.database();
var allData;

// Load the data and print to console ***** TO DO: ADD THIS LOGIC TO isPlayer, isTeam, etc functions *****
const handleData = snap => {
  if (snap.val()) {
    allData = snap.val();
  }
}
db.ref().on('value', handleData, error => console.log(error));






//// Sports Radar API keys ////
const SPORTS_RADAR_MLB_API_KEY = 'gaqjbcjhzw9u2cbcwxxgpadd';
const SPORTS_RADAR_NBA_API_KEY = 'cgz6qzb66rvsupc554j23px9';
// const SPORTS_RADAR_NFL_API_KEY = '2mkne3w4rbx39avqk9whkm73';
const SPORTS_RADAR_NFL_API_KEY = 'hvm97ysp48ywawpaaxxkme8x';
const SPORTS_RADAR_NHL_API_KEY = 'm7zfrvkj86j964gv7rn2twkg';

//base url
const SPORTS_RADAR_API_BASE_URL = 'api.sportradar.us';






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
    } else if (data==="NFL\n" || data==="NBA\n"){

        let sport = data.toLowerCase().replace("\n","");
        let city;

        db.ref('/context-stack/0/').update({
            sport: sport
        });

        const getCity = snap => {
            city = snap.val()
        }

        db.ref('/context-stack/0/city').on('value', getCity, error => console.log(error));


        // find the team in the sport that plays for that city
        let team = teamFromCity(sport, city);
        if (sport==="nfl") {

            
            getNFLScoresOrStandings(team,'howDidTheBlankDo')
            

        } else {

            getNBAScoresOrStandings(team,'howDidTheBlankDo')
            
        }



    } else {
        
        // Check what kind of query the user has made
        let queryType = checkQueryType(data);


        // Get relevant news given data and queryType
        getTheLatest(data, queryType);

    }
});

// when exit, reset context-stack to be none
process.on('SIGINT', function() {
    db.ref('/context-stack/0/').set({
            sport: "none"
    });
    process.exit();
});





// checks what kind of query user has entered and returns string corresponding to query type
// uses simple regex
function checkQueryType (q) {

    const howDidTheBlankDo = /How\sdid\sthe\s([^\s]+)\sdo\?/;
    const howDidBlankDo = /How\sdid\s([^]+)\sdo\?/;
    const howAreTheBlankDoing = /How\sare\sthe\s([^\s]+)\sdoing\?/;
    const whatAboutBlank = /What\sabout\s([^]+)\?/;

    let isHowDidTheBlankDo = howDidTheBlankDo.test(q);
    let isHowDidBlankDo = howDidBlankDo.test(q);
    let isHowAreTheBlankDoing = howAreTheBlankDoing.test(q);
    let isWhatAboutBlank = whatAboutBlank.test(q);

    if (isHowDidTheBlankDo) {
        return 'howDidTheBlankDo';
    } else if (isHowAreTheBlankDoing) {
        return 'howAreTheBlankDoing';
    } else if (isHowDidBlankDo) {
        return 'howDidBlankDo';
    } else if (isWhatAboutBlank) {
        return 'whatAboutBlank';
    }

    
}

// extracts name (of team, player, or city) from string and returns it (string)
function extractName(s, queryType) {

    if (queryType==="howDidTheBlankDo" || queryType==="howAreTheBlankDoing") {
        return s.split('the ')[1].split(' ')[0];;
    } else if (queryType==="howDidBlankDo") {
        return s.split('did ')[1].split(' do')[0];
    }
    else if (queryType==="whatAboutBlank") {
        let term = s.split('about ')[1].replace("?","").indexOf('the ')!=-1? 
                    s.split('about ')[1].replace("?","").split('the ')[1] :
                    s.split('about ')[1].replace("?","");

        return term.replace(/(\r\n|\n|\r)/gm, "");
    }

}


// gets nfl or nba team from city
function teamFromCity(league,city){
    let allTeams = allData[league].teams;
    let numTeams = allTeams.length;

    for (var i =0; i<numTeams; i++) {
        if(city===allTeams[i].city) {

            return allTeams[i].last_name;

        }
    }

    let otherLeague = league==="nfl"? "nba" : "nfl";

    let otherTeams = allData[otherLeague].teams;
    let numOtherTeams = otherTeams.length;

    for (var j=0; j < numOtherTeams; j++) {
        console.log(otherTeams[j])
        if(city===otherTeams[j].city) {

            return otherTeams[j].last_name;

        }


    }
    

}





// check if name is a player
function isPlayer(s) {
    let allPlayers = [];
    let allTeams = allData.nfl.teams.concat(allData.nba.teams);
    let numTeams = allTeams.length;
    let playerTeam;

    for (var i = 0; i < numTeams; i++) {

        if (allTeams[i].players.length>0) {
            let numTeamPlayers = allTeams[i].players.length;

            for (var j = 0; j < numTeamPlayers; j++) {

                allPlayers.push([allTeams[i].players[j].display_name, allTeams[i].last_name, allTeams[i].players[j].league]);

            }
        }

    }
    console.log(allPlayers)

    let numAllPlayerNames = allPlayers.length;
    for (var k=0; k < numAllPlayerNames; k++) {
        if (allPlayers[k][0].includes(s)) {
            return [true, allPlayers[k][1], allPlayers[k][2]];
        }
    }
    return [false];

}

// check if name is a team
function isTeam(s) {
    let allTeamNames = [];
    let allTeams = allData.nfl.teams.concat(allData.nba.teams);
    let numTeams = allTeams.length;

    for (var i = 0; i < numTeams; i++) {
        allTeamNames.push(allTeams[i].last_name);
        allTeamNames.push(allTeams[i].nick_name);
    }

    let teamNamesLength = allTeamNames.length;
    for (var j = 0; j < teamNamesLength; j++) {
        if (allTeamNames[j].includes(s)) {
            return true;
        }
    }
    return false;

}


// gets sport that the team
function whichSport(team) {
    let allTeamNames = [];
    let allTeams = allData.nfl.teams.concat(allData.nba.teams);
    let numTeams = allTeams.length;

    for (var i = 0; i < numTeams; i++) {
        if(allTeams[i].last_name.includes(team)) {
            return allTeams[i].players[0].league;
        }

    }

}



// check if name is a city
function isCity(s) {

    let allCities = [];
    let allTeams = allData.nfl.teams.concat(allData.nba.teams);
    let numTeams = allTeams.length;

    for (var i = 0; i < numTeams; i++) {

        allCities.push(allTeams[i].city);

    }

    if (allCities.includes(s)) {
        return true;
    }

    return false;


}


// gets recent news given a team
function getTeamNews(team) {
    request({
             "url": `${GOOGLE_NEWS_API_BASE_URL}top-headlines?apiKey=${GOOGLE_NEWS_API_KEY}&country=us&category=sports&q=`+team,
             "method": "GET"
         }, (err, res, body) => {

            let articles = JSON.parse(body).articles;
            let numArticles = articles.length;

             if (numArticles > 0) {
                console.log("\n\nHere are the latest headlines for the".green.bold+" "+team.green.bold+":");
                for (var i=0; i < numArticles; i++) {

                    if (articles[i].source.name!="Youtube.com") {
                        let messageText = JSON.parse(body).articles[i].content.split(' [')[i].brightWhite.bgBlue;
                        let messageURL = JSON.parse(body).articles[i].url.underline.brightRed;


                        console.log(messageURL+"\n"+messageText+"\n^Learn more at link above^\n".zebra+"\n");
                    } else {
                        let messageText = JSON.parse(body).articles[i].title.brightWhite.bgBlue;;
                        let messageURL = JSON.parse(body).articles[i].url.underline.brightRed;

                        console.log("\n\nCHECK IT OUT:".green.bold+"\n"+messageURL+"\n"+messageText+"\n^Learn more at link above^\n".zebra+"\n\n");

                    }
                }
                
            } else {
                console.log("\n\n"+"Hmm...I'm pretty dumb so I didn't find anything recent on the ".white.bold.bgRed+team.white.bold.bgRed+". Try asking Google!".white.bold.bgRed+"\n\n");
            }
        
             if (err){
                 console.log("News API Error: ", err);
             }
    });

}


function getNBAPlayerNews(player, team) {
    console.log('nba team to search for: ',team);



    //we can get the year and season-type from the available seasons endpoint (get the last JSON object that is returned)
    let currYear = new Date().getFullYear().toString();
    let currSeasonType;

    const seasonsOptions = {
        hostname: SPORTS_RADAR_API_BASE_URL,
        path: '/nba/trial/v7/en/league/seasons.json?api_key='+SPORTS_RADAR_NBA_API_KEY,
        method: 'GET'
    }

    const seasonsReq = https.request(seasonsOptions, (res) => {
        // console.log(options);
        console.log('nba seasons statusCode: ', res.statusCode);
        // console.log('seasons headers: ', res.headers);


        res.on('data', (d) => {
            let seasons = JSON.parse(d.toString()).seasons;
            currSeasonType = seasons[seasons.length-1].type.code;

            // console.log('it is currently the nba '+currSeasonType+' season in '+currYear)


            // have to delay program execution so that don't go over 1 Qps limit imposed by SportsRadar API when we make req below
            var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
            (async () => { 

                await wait(1000);   

                // given the year and season type we can get the schedule for that season (ultimately to get the current week)
                let schedule;
                const scheduleOptions = {
                    hostname: SPORTS_RADAR_API_BASE_URL,
                    path: '/nba/trial/v7/en/games/'+currYear+'/'+currSeasonType+'/schedule.json?api_key='+SPORTS_RADAR_NBA_API_KEY,
                    method: 'GET'
                }

                const scheduleReq = https.request(scheduleOptions, (res) => {
                    // console.log(options);
                    console.log('nba schedule statusCode: ', res.statusCode);
                    // console.log('schedule headers: ', res.headers);

                    // create array for all data
                    let chunks = [];

                    res.on('data', function (d) {
                        
                        // append to that array
                        chunks.push(d);



                    }).on('end', function () {

                        //create buffer from the bytes in the chunks array ONLY AFTER all of it has been received then cast to string and parse JSON object
                        let d = Buffer.concat(chunks);
                        let schedule = JSON.parse(d.toString()).games;
                        let numGames = schedule.length;
                        let nearestUpcoming;
                        let game;
                        let home;
                        let away;
                        let homeScore;
                        let awayScore;
                        // console.log(schedule)




                       /* 1. Iterate through the games for that season's schedule
                          2. Find the first game that is "scheduled" and get that index
                          3. Iterate backwards through the games until you find a game that has that team
                          4. Get news on that team using that game's info 
                          5. Break */ 
                          for (var i = 0; i < numGames; i++) {
                            if (schedule[i].status==="scheduled") {
                                nearestUpcoming = i;
                                break;
                            }

                          }


                          for (var j = nearestUpcoming; j > -1; j--) {
                            if (schedule[j].home.name.includes(team) || schedule[j].away.name.includes(team)) {
                                //console.log(schedule[j])
                                game = schedule[j]
                                home = game.home;
                                away = game.away;
                                break;

                            }

                          }


                          let gameID = game.id;
                          let status = game.status;

                          // have to delay bc of qps limit
                          (async () =>{
                            await wait(1000);

                              const playerStatsOptions = {
                                hostname: SPORTS_RADAR_API_BASE_URL,
                                path: '/nba/trial/v7/en/games/'+gameID+'/summary.json?api_key='+SPORTS_RADAR_NBA_API_KEY,
                                method: 'GET'
                              }


                              const playerStatsReq = https.request(playerStatsOptions, (res) => {
                                // console.log(options);
                                console.log('nba playerstats statusCode: ', res.statusCode);
                                // console.log('schedule headers: ', res.headers);

                                // create array for all data
                                let chunks = [];

                                res.on('data', function (d) {
                                    
                                    // append to that array
                                    chunks.push(d);



                                }).on('end', function() {
                                    //create buffer from the bytes in the chunks array ONLY AFTER all of it has been received then cast to string and parse JSON object
                                    let d = Buffer.concat(chunks);
                                    let homePlayers = JSON.parse(d.toString()).home.players;
                                    let awayPlayers = JSON.parse(d.toString()).away.players;
                                    let allPlayers = homePlayers.concat(awayPlayers);
                                    let numGamePlayers = allPlayers.length;
                                    let playerStats;
                                    
                                    
                                    
                                    /* Find the player we are concerned with and get their stats*/
                                    for (var i = 0; i < numGamePlayers; i++) {

                                        if (allPlayers[i].full_name.includes(player)) {

                                            playerStats = allPlayers[i].statistics;
                                            break;

                                        }

                                    }


                                   // get news and narrow using name and stats from game 
                                    request({
                                     "url": `${GOOGLE_NEWS_API_BASE_URL}everything?apiKey=${GOOGLE_NEWS_API_KEY}&q=`+player.split(' ')[0]+'+'+player.split(' ')[1]+'&sortBy=publishedAt',
                                     "method": "GET"
                                    }, (err, res, body) => {


                                        let keywords;
                                        const loadKeywords = snap => {
                                          if (snap.val()) {
                                            keywords = snap.val();
                                          }
                                        }
                                        db.ref('/nba/statCats/').on('value', loadKeywords, error => console.log(error));


                                        let numKeywords = keywords.length;
                                        for (var i=0; i < numKeywords; i++) {

                                            if (playerStats[keywords[i]]) {
                                                keywords.push(playerStats[keywords[i]]);
                                            }

                                        }

                                        console.log(keywords);


                                        let articles = JSON.parse(body).articles;
                                        let numArticles = articles.length;

                                         if (numArticles > 0) {


                                            // Filter the articles
                                            let toInclude = article => {
                                                return article.title.includes(player) ? true : 
                                                            keywords.some(element => article.title.includes(element) || article.description.includes(element)) && article.description.includes(player) ? 
                                                            true : 
                                                            false;
                                            }

                                            let filteredArticles = articles.filter(toInclude);
                                            let numFilteredArticles = filteredArticles.length;



                                            if (numFilteredArticles>0) {



                                                // ******************* TO-DO: MAKE OUTPUT PRETTIER FORMAT ********************* //
                                                console.log(filteredArticles)


                                            } else {

                                                // If the initial filter is too narrow then loosen scope
                                                let lessNarrowFilter = article => {

                                                    return article.title.includes(player) || article.description.includes(player) || article.content.includes(player)
                                                }   

                                                let newFilteredArticles = articles.filter(lessNarrowFilter);
                                                let numNewFilteredArticles = newFilteredArticles.length;

                                                if (numNewFilteredArticles > 0) {
                                                    // ******************* TO-DO: MAKE OUTPUT PRETTIER FORMAT ********************* //
                                                    console.log(newFilteredArticles);
                                                } else {
                                                    // If less narrow filter still to narrow then just print the stats from most recent game

                                                    // ******************* TO-DO: MAKE OUTPUT PRETTIER FORMAT ********************* //
                                                    console.log(playerStats);
                                                }

                                            }

                                            
                                            
                                        } else {
                                            console.log("\n\n"+"Hmm...I'm pretty dumb so I didn't find anything recent on the ".white.bold.bgRed+team.white.bold.bgRed+". Try asking Google!".white.bold.bgRed+"\n\n");
                                             
                                        }
                                    
                                         if (err){
                                             console.log("News API Error: ", err);
                                         }
                                    });


                                });


                            });

                            playerStatsReq.on('error', (e) => {
                                console.error(e)
                            });

                            playerStatsReq.end();

                    })();
                });

                
            });
                
                
            scheduleReq.on('error', (e) => {
              console.error(e);
            });

            scheduleReq.end();
        })();

      });
    

    });
                                     
    seasonsReq.on('error', (e) => {
      console.error(e);
    });

    seasonsReq.end();

}




function getNBAScoresOrStandings(team, queryType) {

    console.log('nba team to search for: ',team);



    //we can get the year and season-type from the available seasons endpoint (get the last JSON object that is returned)
    let currYear = new Date().getFullYear().toString();
    let currSeasonType;

    const seasonsOptions = {
        hostname: SPORTS_RADAR_API_BASE_URL,
        path: '/nba/trial/v7/en/league/seasons.json?api_key='+SPORTS_RADAR_NBA_API_KEY,
        method: 'GET'
    }

    const seasonsReq = https.request(seasonsOptions, (res) => {
        // console.log(options);
        console.log('nba seasons statusCode: ', res.statusCode);
        // console.log('seasons headers: ', res.headers);


        res.on('data', (d) => {
            let seasons = JSON.parse(d.toString()).seasons;
            currSeasonType = seasons[seasons.length-1].type.code;

            if (queryType==='howDidTheBlankDo' || queryType==='howDidBlankDo') {
                // have to delay program execution so that don't go over 1 Qps limit imposed by SportsRadar API when we make req below
                var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
                (async () => { 

                    await wait(1000);   

                    
                    // given the year and season type we can get the schedule for that season (ultimately to get the current week)
                    let schedule;
                    const scheduleOptions = {
                        hostname: SPORTS_RADAR_API_BASE_URL,
                        path: '/nba/trial/v7/en/games/'+currYear+'/'+currSeasonType+'/schedule.json?api_key='+SPORTS_RADAR_NBA_API_KEY,
                        method: 'GET'
                    }

                    const scheduleReq = https.request(scheduleOptions, (res) => {
                        // console.log(options);
                        console.log('nba schedule statusCode: ', res.statusCode);
                        // console.log('schedule headers: ', res.headers);

                        // create array for all data
                        let chunks = [];

                        res.on('data', function (d) {
                            
                            // append to that array
                            chunks.push(d);



                        }).on('end', function () {

                            //create buffer from the bytes in the chunks array ONLY AFTER all of it has been received then cast to string and parse JSON object
                            let d = Buffer.concat(chunks);
                            let schedule = JSON.parse(d.toString()).games;
                            let numGames = schedule.length;
                            let nearestUpcoming;
                            let game;
                            let home;
                            let away;
                            let homeScore;
                            let awayScore;
                            // console.log(schedule)




                           /* 1. Iterate through the games for that season's schedule
                              2. Find the first game that is "scheduled" and get that index
                              3. Iterate backwards through the games until you find a game that has that team
                              4. Get news on that team using that game's info 
                              5. Break */ 
                              for (var i = 0; i < numGames; i++) {
                                if (schedule[i].status==="scheduled") {
                                    nearestUpcoming = i;
                                    break;
                                }

                              }


                              for (var j = nearestUpcoming; j > -1; j--) {
                                if (schedule[j].home.name.includes(team) || schedule[j].away.name.includes(team)) {
                                    //console.log(schedule[j])
                                    game = schedule[j]
                                    home = game.home;
                                    away = game.away;
                                    break;

                                }

                              }


                              let gameID = game.id;
                              let status = game.status;

                              // have to delay program execution so that don't go over 1 Qps limit imposed by SportsRadar API when we make req below
                            
                              /* If the game is going on then get the current score and console.log it */
                              if (status==='inprogress' || status==='halftime') {

                                // have to delay program execution so that don't go over 1 Qps limit imposed by SportsRadar API when we make req below
                                var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
                                (async () => { 

                                    await wait(1000);
                                    const liveScoreOptions =  {
                                        hostname: SPORTS_RADAR_API_BASE_URL,
                                        path: '/nba/trial/v7/en/games/'+gameID+'/boxscore.json?api_key='+SPORTS_RADAR_NBA_API_KEY,
                                        method: 'GET'
                                    }

                                    const liveScoreReq = https.request(liveScoreOptions, (res) => {
                                        console.log('nba livescore statusCode: ', res.statusCode);
                                        let chunks = [];

                                         res.on('data', function (d) {
                                                                
                                            // append to that array
                                            chunks.push(d);

                                        }).on('end', function () {
                                            let d = Buffer.concat(chunks);
                                            let gameData = JSON.parse(d.toString())

                                            

                                            homeScore = gameData.home.points;
                                            awayScore = gameData.away.points;

                                            // Log the current score in the game
                                            console.log('The current score is: '+gameData.home.name+': '+gameData.home.points+' '+gameData.away.name+': '+gameData.away.points);



                                        });

                                   });

                                    liveScoreReq.on('error', (e) => {
                                        console.log(e);
                                    });

                                    liveScoreReq.end();

                                })();

                             } 
                             // else {


                             //    // if (queryType==="howDidTheBlankDo" || queryType==="howDidBlankDo") {
                             //    //     // have to delay program execution so that don't go over 1 Qps limit imposed by SportsRadar API when we make req below
                             //    //     var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
                             //    //     (async () => {
                             //    //         await wait(1000);

                             //    //         const previousScoreOptions = {
                             //    //             hostname: SPORTS_RADAR_API_BASE_URL,
                             //    //             path: '/nba/trial/v7/en/games/'+gameID+'/boxscore.json?api_key='+SPORTS_RADAR_NBA_API_KEY,
                             //    //             method: 'GET'
                             //    //         }

                             //    //         const previousScoreReq = https.request(previousScoreOptions, (res) => {
                             //    //             console.log('nba recent score statusCode: ', res.statusCode);

                             //    //             let chunks = [];

                             //    //              res.on('data', function (d) {
                                                                    
                             //    //                 // append to that array
                             //    //                 chunks.push(d);

                             //    //             }).on('end', function () {
                             //    //                 let d = Buffer.concat(chunks);
                             //    //                 let gameData = JSON.parse(d.toString())

                                                

                             //    //                 homeScore = gameData.home.points;
                             //    //                 awayScore = gameData.away.points;

                             //    //                 let higherScore = homeScore > awayScore? homeScore: awayScore;
                             //    //                 let lowerScore = homeScore < awayScore? homeScore: awayScore;
                             //    //                 let newsQueryString = home.name.split(' ')[home.name.split(' ').length-1]+'+'+away.name.split(' ')[away.name.split(' ').length-1]+'+'+higherScore+'-'+lowerScore;

                                                


                             //    //                 request({
                             //    //                          "url": `${GOOGLE_NEWS_API_BASE_URL}everything?apiKey=${GOOGLE_NEWS_API_KEY}&q=`+newsQueryString,
                             //    //                          "method": "GET"
                             //    //                      }, (err, res, body) => {

                             //    //                         let articles = JSON.parse(body).articles;
                             //    //                         let numArticles = articles.length;

                             //    //                          if (numArticles > 0) {

                             //    //                             for (var i =0; i < numArticles; i++) {

                             //    //                                 if (articles[i].title && articles[i].description && articles[i].content && (articles[i].title.includes(higherScore+"-"+lowerScore) || articles[i].description.includes(higherScore+"-"+lowerScore) ||
                             //    //                                     articles[i].content.includes(higherScore+"-"+lowerScore))) {
                                                                    

                             //    //                                     // ***************** TO DO: FORMAT THIS NICELY SO PRINTS PRETTY IN CONSOLE ***************** //
                             //    //                                     console.log(articles[i]);
                             //    //                                 }

                             //    //                             }
           
                                                            
                             //    //                         } else {
                             //    //                             console.log("\n\n"+"Hmm...I'm pretty dumb so I didn't find anything recent on the ".white.bold.bgRed+team.white.bold.bgRed+". Try asking Google!".white.bold.bgRed+"\n\n");
                             //    //                         }
                                                    
                             //    //                          if (err){
                             //    //                              console.log("News API Error: ", err);
                             //    //                          }
                             //    //                 });


                             //    //             });


                             //    //         });

                             //    //         previousScoreReq.on('error', (e) => {
                             //    //             console.log(e);
                             //    //         });

                             //    //         previousScoreReq.end();


                             //    //     })();

                             //    // } else if (queryType==="howAreTheBlankDoing") {

                             //    //     /* Get Standings Information*/
                             //    //     console.log('getting nba standings info for the '+team)


                             //    // }


                             // }

                        });


                    });

                    scheduleReq.on('error', (e) => {
                      console.error(e);
                    });

                    scheduleReq.end();

                })();  

            } else if (queryType==='howAreTheBlankDoing') {

                // get nba standings for given team
                const standingsOptions = {
                    hostname: SPORTS_RADAR_API_BASE_URL,
                    path: '/nba/trial/v7/en/seasons/'+currYear+'/'+currSeasonType+'/standings.json?api_key='+SPORTS_RADAR_NBA_API_KEY,
                    method: 'GET'
                }

                    var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
                    (async () => { 

                        await wait(1000);
                        const standingsReq = https.request(standingsOptions, (res) => {
                            // console.log(options);
                            console.log('nba standings statusCode: ', res.statusCode);
                            // console.log('seasons headers: ', res.headers);

                            let chunks = [];

                             res.on('data', function (d) {
                                                    
                                // append to that array
                                chunks.push(d);

                            }).on('end', function () {

                                let d = Buffer.concat(chunks);
                                let standingsData = JSON.parse(d.toString());

                                let east = standingsData.conferences[0];
                                let west = standingsData.conferences[1];


                                let numDivisions = east.divisions.length;
                                let numDivisionTeams = east.divisions[0].teams.length;

                                for(let i = 0; i<numDivisions; i++) {

                                    for (let j = 0; j < numDivisionTeams; j++) {

                                        // check both conferences and each division within that conference for the team to get their standings
                                        if (east.divisions[i].teams[j].name.includes(team)) {
                                            let streakType = east.divisions[i].teams[j].streak.type==="loss"? "losing" : "winning";
                                            let streakLength = east.divisions[i].teams[j].streak.length;

                                            let wins = east.divisions[i].teams[j].wins;
                                            let losses = east.divisions[i].teams[j].losses;



                                            console.log("The "+team+" are on a "+streakLength+"-game "+streakType+" streak and stand at "+wins+"-"+losses+" on the season.");

                                        } else if (west.divisions[i].teams[j].name.includes(team)) {
                                                let streakType = west.divisions[i].teams[j].streak.type==="loss"? "losing" : "winning";
                                                let streakLength = west.divisions[i].teams[j].streak.length;

                                                let wins = west.divisions[i].teams[j].wins;
                                                let losses = west.divisions[i].teams[j].losses;




                                                console.log("The "+team+" are on a "+streakLength+"-game "+streakType+" streak and stand at "+wins+"-"+losses+" on the season.");

                                        }

                                    }

                                }


                            });






                        });

                        standingsReq.on('error', (e) => {
                            console.error(e)
                        });

                        standingsReq.end();

                    })();

            }
            
        });


    });


    seasonsReq.on('error', (e) => {
      console.error(e);
    });

    seasonsReq.end();

}





function getNFLPlayerGameStats(player, team, schedule, week) {

    let weekGames = schedule[week].games;
    let numGames = weekGames.length;
    let playerPosition;
    let gameID;


    let foundTeam = false;

    // find gameID for the game in which the player and his team were playing in 
    for (var i = 0; i<numGames; i++ ) {
        if (weekGames[i].home.name.includes(team) || weekGames[i].away.name.includes(team)) {
            foundTeam = true;
            gameID = weekGames[i].id;

        }
    }


    // if we didn't find the team in this week, they must be on a bye so search last week
    // otherwise get the previous week's games, search for that team's game and return the players stats from most recent game
    if (!foundTeam) {
        getNFLPlayerGameStats(player, team, schedule, week-1);

    }




    // First need to find the position of the player because then we can map positions to statistical categories in firebase
    const playerPositionOptions = {
        hostname: SPORTS_RADAR_API_BASE_URL,
        path: '/nfl/official/trial/v5/en/games/'+gameID+'/roster.json?api_key='+SPORTS_RADAR_NFL_API_KEY,
        method: 'GET'
    }

    var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
    (async () => {
        await wait(1000);

        const playerPositionReq = https.request(playerPositionOptions, (res) => {
            console.log('playerposition statusCode: ', res.statusCode);

            // array for bytes
            let chunks = [];

            res.on('data', function (d) {
                
                // append to that array
                chunks.push(d);


            }).on('end', function () {
                //create buffer from the bytes in the chunks array ONLY AFTER all of it has been received then cast to string and parse JSON object
                let d = Buffer.concat(chunks);
                let homePlayers = JSON.parse(d.toString()).home.players;
                let awayPlayers = JSON.parse(d.toString()).away.players;
                let allGamePlayers = homePlayers.concat(awayPlayers);
                let numGamePlayers = allGamePlayers.length;

                // Getting position to stat category map from firebase
                let posToStat;
                const loadMap = snap => {
                  if (snap.val()) {
                    posToStat = snap.val();
                    // console.log(posToStat)
                  }
                }
                db.ref('/nfl/posToStat').on('value', loadMap, error => console.log(error));

                // Find the position that the player plays and query the mapping in firebase to find out stat. key (e.g. "WR" in NFL maps to "receiving" stats)
                for (var i = 0; i < numGamePlayers; i++) {
                    if (allGamePlayers[i].name.includes(player)) {

                        playerPosition = allGamePlayers[i].position;

                    }

                }

                // Get stat category to search for
                let statCategory = posToStat[playerPosition][0];

                // check if the game includes the team in question
                const gameStatsOptions = {
                    hostname: SPORTS_RADAR_API_BASE_URL,
                    path: '/nfl/official/trial/v5/en/games/'+gameID+'/statistics.json?api_key='+SPORTS_RADAR_NFL_API_KEY,
                    method: 'GET'
                }

                var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
                (async () => { 

                    await wait(1000);
                    const gameStatsReq = https.request(gameStatsOptions, (res) => {

                        console.log('gamestats statusCode: ', res.statusCode);

                        // array for bytes
                        let chunks = [];

                        res.on('data', function (d) {
                            
                            // append to that array
                            chunks.push(d);



                        }).on('end', function () {
                            //create buffer from the bytes in the chunks array ONLY AFTER all of it has been received then cast to string and parse JSON object
                            let d = Buffer.concat(chunks);
                            // let homePlayerStats = JSON.parse(d.toString()).statistics.home;
                            // let awayPlayerStats = JSON.parse(d.toString()).statistics.away;
                            // let allPlayerStats = homePlayerStats.concat(awayPlayerStats);
                            // let numPlayerStats = allPlayerStats.length;

                            let playerTeam = JSON.parse(d.toString()).statistics.home.name.includes(team) ? "home" : "away";
                            let playerPositionStats = JSON.parse(d.toString()).statistics[playerTeam][statCategory].players;
                            let numPlayerPositionStats = playerPositionStats.length;
                            let playerStats;

                            

                            // Iterate through the position's stats and return the player's stats
                            for (var i=0; i < numPlayerPositionStats; i++) {


                                // ********************** TO-DO: LOG THIS TO CONSOLE IN PRETTY MANNER ********************** //
                                if (playerPositionStats[i].name.includes(player)) {
                                    playerStats = playerPositionStats[i];
                                    console.log(playerPositionStats[i])
                                    break;
                                }
                            }





                            // Get news using the stat-line of the player to filter results
                            request({
                                     "url": `${GOOGLE_NEWS_API_BASE_URL}everything?apiKey=${GOOGLE_NEWS_API_KEY}&q=`+player.split(' ')[0]+'+'+player.split(' ')[1]+'&sortBy=publishedAt',
                                     "method": "GET"
                                    }, (err, res, body) => {


                                        let keywords;
                                        const loadKeywords = snap => {
                                          if (snap.val()) {
                                            keywords = snap.val();
                                          }
                                        }
                                        db.ref('/nfl/posToStat/'+playerPosition).on('value', loadKeywords, error => console.log(error));


                                        let numKeywords = keywords.length;
                                        for (var i=0; i < numKeywords; i++) {

                                            if (playerStats[keywords[i]]) {
                                                keywords.push(playerStats[keywords[i]]);
                                            }

                                        }

                                        console.log(keywords);


                                        let articles = JSON.parse(body).articles;
                                        let numArticles = articles.length;

                                         if (numArticles > 0) {


                                            // Filter the articles
                                            let toInclude = article => {
                                                return article.title.includes(player) ? true : 
                                                            keywords.some(element => article.title.includes(element) || article.description.includes(element)) && article.description.includes(player) ? 
                                                            true : 
                                                            false;
                                            }

                                            let filteredArticles = articles.filter(toInclude);
                                            let numFilteredArticles = filteredArticles.length;



                                            if (numFilteredArticles>0) {



                                                // ******************* TO-DO: MAKE OUTPUT PRETTIER FORMAT ********************* //
                                                console.log(filteredArticles)


                                            } else {

                                                // If the initial filter is too narrow then loosen scope
                                                let lessNarrowFilter = article => {

                                                    return article.title.includes(player) || article.description.includes(player) || article.content.includes(player)
                                                }   

                                                let newFilteredArticles = articles.filter(lessNarrowFilter);
                                                let numNewFilteredArticles = newFilteredArticles.length;

                                                if (numNewFilteredArticles > 0) {
                                                    // ******************* TO-DO: MAKE OUTPUT PRETTIER FORMAT ********************* //
                                                    console.log(newFilteredArticles);
                                                } else {
                                                    // If less narrow filter still to narrow then just print the stats from most recent game

                                                    // ******************* TO-DO: MAKE OUTPUT PRETTIER FORMAT ********************* //
                                                    console.log(playerStats);
                                                }

                                            }








                                            
                                            
                                        } else {
                                            console.log("\n\n"+"Hmm...I'm pretty dumb so I didn't find anything recent on the ".white.bold.bgRed+team.white.bold.bgRed+". Try asking Google!".white.bold.bgRed+"\n\n");
                                             
                                        }
                                    
                                         if (err){
                                             console.log("News API Error: ", err);
                                         }
                                });

                        


                        });

                    });



                    gameStatsReq.on('error', (e) => {
                      console.error(e);
                    });

                    gameStatsReq.end();

                    // if we didn't find the team in this week, they must be on a bye so search last week
                    // otherwise get the previous week's games, search for that team's game and return the players stats from most recent game
                    if (!foundTeam) {
                        getNFLPlayerGameStats(player, team, schedule, week-1);


                    }


                })();

                 

                



            });

        });

        playerPositionReq.on('error', (e) => {
          console.error(e);
        });

        playerPositionReq.end();

    })();




    






}





// Gets news about a specific player
function getNFLPlayerNews(player, team) { 

//we can get the year and season-type from the available seasons endpoint (get the last JSON object that is returned)
    let currYear = new Date().getFullYear().toString();
    let currSeasonType;

    const seasonsOptions = {
        hostname: SPORTS_RADAR_API_BASE_URL,
        path: '/nfl/official/trial/v5/en/league/seasons.json?api_key='+SPORTS_RADAR_NFL_API_KEY,
        method: 'GET'
    }

    const seasonsReq = https.request(seasonsOptions, (res) => {
        // console.log(options);
        console.log('seasons statusCode: ', res.statusCode);
        // console.log('seasons headers: ', res.headers);


        res.on('data', (d) => {
            let seasons = JSON.parse(d.toString()).seasons;
            currSeasonType = seasons[seasons.length-1].type.code;


            // have to delay program execution so that don't go over 1 Qps limit imposed by SportsRadar API when we make req below
            var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
            (async () => { 

                await wait(1000);   

                
                // given the year and season type we can get the schedule for that season (ultimately to get the current week)
                let schedule;
                const scheduleOptions = {
                    hostname: SPORTS_RADAR_API_BASE_URL,
                    path: '/nfl/official/trial/v5/en/games/'+currYear+'/'+currSeasonType+'/schedule.json?api_key='+SPORTS_RADAR_NFL_API_KEY,
                    method: 'GET'
                }

                const scheduleReq = https.request(scheduleOptions, (res) => {
                    // console.log(options);
                    console.log('schedule statusCode: ', res.statusCode);
                    // console.log('schedule headers: ', res.headers);

                    // create array for all data
                    let chunks = [];

                    res.on('data', function (d) {
                        
                        // append to that array
                        chunks.push(d);



                    }).on('end', function () {

                        //create buffer from the bytes in the chunks array ONLY AFTER all of it has been received then cast to string and parse JSON object
                        let d = Buffer.concat(chunks);
                        let schedule = JSON.parse(d.toString()).weeks;
                        let numWeeks = schedule.length;
                        let currWeek = 0;

                        /* iterate through the season schedule's weeks array and check the first element of games array for "scheduled" instead of "closed"
                           or sort games array by date and check last element to know what week it is */
                        for (let i = 0; i < numWeeks; i++) {
                            if(schedule[i].games[0].status==="scheduled" || schedule[i].games[0].status==="inprogress" || schedule[i].games[0].status==="halftime") {
                                currWeek = schedule[i].sequence;
                                break;
                            }
                        }

                        // we then check the games array for the current week to see if the team is playing or already played and get the game id
                        let currWeekGames = schedule[currWeek-1].games;
                        let numCurrWeekGames = currWeekGames.length;
                        let foundTeam = false;
                        for (let j =0; j < numCurrWeekGames; j++) { 
                            

                            // check if the game includes the team in question
                            if (currWeekGames[j].home.name.includes(team) || currWeekGames[j].away.name.includes(team)) {
                                foundTeam = true;
                                if (currWeekGames[j].status==="inprogress" || currWeekGames[j].status==="halftime" || currWeekGames[j].status==="complete") {

                                    // ****************** TO DO: get the game id and then use it to get player stats for that game ****************** //


                                } else {

                                    // We know if game isn't in progress, at half, or complete then it is yet to be played in the current week. So 
                                    // get stat information about player from last week's game
                                    getNFLPlayerGameStats(player, team, schedule, currWeek-2);


                                }
                            }



                        } 

                        // if we didn't find the team in this week, they must be on a bye so search last week
                        // otherwise get the previous week's games, search for that team's game and return the players stats from most recent game
                        if (!foundTeam) {


                        }

                    });


                });

                scheduleReq.on('error', (e) => {
                  console.error(e);
                });

                scheduleReq.end();

            })();  


        });


    });


    seasonsReq.on('error', (e) => {
      console.error(e);
    });

    seasonsReq.end();

}



// gets scores/standings related articles given a team
function getNFLScoresOrStandings(team, queryType) {
    console.log('team to search for: ',team);



    //we can get the year and season-type from the available seasons endpoint (get the last JSON object that is returned)
    let currYear = new Date().getFullYear().toString();
    let currSeasonType;

    const seasonsOptions = {
        hostname: SPORTS_RADAR_API_BASE_URL,
        path: '/nfl/official/trial/v5/en/league/seasons.json?api_key='+SPORTS_RADAR_NFL_API_KEY,
        method: 'GET'
    }

    const seasonsReq = https.request(seasonsOptions, (res) => {
        // console.log(options);
        console.log('seasons statusCode: ', res.statusCode);
        // console.log('seasons headers: ', res.headers);


        res.on('data', (d) => {
            let seasons = JSON.parse(d.toString()).seasons;
            currSeasonType = seasons[seasons.length-1].type.code;


            // have to delay program execution so that don't go over 1 Qps limit imposed by SportsRadar API when we make req below
            var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
            (async () => { 

                await wait(1000);   

                
                // given the year and season type we can get the schedule for that season (ultimately to get the current week)
                let schedule;
                const scheduleOptions = {
                    hostname: SPORTS_RADAR_API_BASE_URL,
                    path: '/nfl/official/trial/v5/en/games/'+currYear+'/'+currSeasonType+'/schedule.json?api_key='+SPORTS_RADAR_NFL_API_KEY,
                    method: 'GET'
                }

                const scheduleReq = https.request(scheduleOptions, (res) => {
                    // console.log(options);
                    console.log('schedule statusCode: ', res.statusCode);
                    // console.log('schedule headers: ', res.headers);

                    // create array for all data
                    let chunks = [];

                    res.on('data', function (d) {
                        
                        // append to that array
                        chunks.push(d);



                    }).on('end', function () {

                        //create buffer from the bytes in the chunks array ONLY AFTER all of it has been received then cast to string and parse JSON object
                        let d = Buffer.concat(chunks);
                        let schedule = JSON.parse(d.toString()).weeks;
                        let numWeeks = schedule.length;
                        let currWeek = 0;

                        /* iterate through the season schedule's weeks array and check the first element of games array for "scheduled" instead of "closed"
                           or sort games array by date and check last element to know what week it is */
                        for (let i = 0; i < numWeeks; i++) {
                            if(schedule[i].games[0].status==="scheduled" || schedule[i].games[0].status==="inprogress" || schedule[i].games[0].status==="halftime") {
                                currWeek = schedule[i].sequence;
                                break;
                            }
                        }

                        // we then check the games array for the current week to see if the team is playing or already played and return either current or most recent score
                        let currWeekGames = schedule[currWeek-1].games;
                        let numCurrWeekGames = currWeekGames.length;
                        let foundTeam = false;
                        for (let j =0; j < numCurrWeekGames; j++) { 
                            

                            // check if the game includes the team in question
                            if (currWeekGames[j].home.name.includes(team) || currWeekGames[j].away.name.includes(team)) {
                                foundTeam = true;

                                // if the game is in progress, then return the score
                                if (currWeekGames[j].status==="inprogress" || currWeekGames[j].status==="halftime" || currWeekGames[j].status==="complete") {

                                    // ****************** TO DO: get the score info and console.log it ****************** //


                                } else {
                                    // get the previous week's score or standings depending on the queryType
                                    if (queryType==="howDidTheBlankDo" || queryType==="howDidBlankDo") {

                                        getPrevWeekScore(team, schedule, currWeek-2);

                                    } else if (queryType==="howAreTheBlankDoing") {


                                        getNFLStandings(team, currYear);

                                    }

                                }

                            } 

                        } 

                        // if we didn't find the team in this week, they must be on a bye so search last week
                        // otherwise get the previous week's games, search for that team's game and return the score or standings
                        if (!foundTeam) {


                            if (queryType==="howDidTheBlankDo") {

                                getPrevWeekScore(team, schedule, currWeek-2);

                            } else if (queryType==="howAreTheBlankDoing") {

                                getNFLStandings(team, currYear);

                            }
                        }

                    });


                });

                scheduleReq.on('error', (e) => {
                  console.error(e);
                });

                scheduleReq.end();

            })();  


        });


    });


    seasonsReq.on('error', (e) => {
      console.error(e);
    });

    seasonsReq.end();

}


// gets the current standings info for the given team
function getNFLStandings(team, currYear) {

    const standingsOptions = {
        hostname: SPORTS_RADAR_API_BASE_URL,
        path: '/nfl/official/trial/v5/en/seasons/'+currYear+'/standings.json?api_key='+SPORTS_RADAR_NFL_API_KEY,
        method: 'GET'
    }

    var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
    (async () => { 

        await wait(1000);
        const standingsReq = https.get(standingsOptions, (res) => {

            console.log('standings statusCode', res.statusCode);
            // create array for all data
            let chunks = [];

            res.on('data', function (d) {
                // append to that array
                chunks.push(d);

            }).on('end', function () {

                //create buffer from the bytes in the chunks array ONLY AFTER all of it has been received then cast to string and parse JSON object
                let d = Buffer.concat(chunks);
                let afc = JSON.parse(d.toString()).conferences[0];
                let nfc = JSON.parse(d.toString()).conferences[1];


                let numDivisions = afc.divisions.length;
                let numDivisionTeams = afc.divisions[0].teams.length;

                for(let i = 0; i<numDivisions; i++) {

                    for (let j = 0; j < numDivisionTeams; j++) {

                        // check both conferences and each division within that conference for the team to get their standings
                        if (afc.divisions[i].teams[j].name.includes(team)) {
                            let streakType = afc.divisions[i].teams[j].streak.type==="loss"? "losing" : "winning";
                            let streakLength = afc.divisions[i].teams[j].streak.length;

                            let wins = afc.divisions[i].teams[j].wins;
                            let losses = afc.divisions[i].teams[j].losses;



                            console.log("The "+team+" are on a "+streakLength+"-game "+streakType+" streak and stand at "+wins+"-"+losses+" on the season.");

                        } else if (nfc.divisions[i].teams[j].name.includes(team)) {
                                let streakType = nfc.divisions[i].teams[j].streak.type==="loss"? "losing" : "winning";
                                let streakLength = nfc.divisions[i].teams[j].streak.length;

                                let wins = nfc.divisions[i].teams[j].wins;
                                let losses = nfc.divisions[i].teams[j].losses;




                                console.log("The "+team+" are on a "+streakLength+"-game "+streakType+" streak and stand at "+wins+"-"+losses+" on the season.");

                        }

                    }

                }

            });

        });

        standingsReq.on('error', (e) => {
          console.error(e);
        });

        standingsReq.end();

    })();

}





// gets the previous week's score given team, season schedule, and an index for previous week
function getPrevWeekScore(team, schedule, prevWeek) {

    // get the previous week's games, search for that team's game and return the score
    let prevWeekGames = schedule[prevWeek].games;
    let numPrevWeekGames = prevWeekGames.length;
    let teamFound = false;

    for (let k = 0; k < numPrevWeekGames; k++) {

        // console.log(prevWeekGames[k].home.name)
        // console.log(prevWeekGames[k].away.name)

        // if we find a match for the team name in the previous week's game, console.log the score of that game
        if (prevWeekGames[k].home.name.includes(team) || prevWeekGames[k].away.name.includes(team)) {
            teamFound = true;

            let teamScoreKey = prevWeekGames[k].home.name.includes(team) ? "home_points" : "away_points";
            let opposingScoreKey = prevWeekGames[k].home.name.includes(team) ? "away_points" : "home_points";

            let teamName = prevWeekGames[k].home.name.includes(team) ? prevWeekGames[k].home.name : prevWeekGames[k].away.name;
            let opposingName = prevWeekGames[k].home.name.includes(team) ? prevWeekGames[k].away.name : prevWeekGames[k].home.name;

            let teamScore = prevWeekGames[k].scoring[teamScoreKey];
            let opposingScore = prevWeekGames[k].scoring[opposingScoreKey];

            let recencyInWeeks = weeksBetween(new Date(prevWeekGames[k].scheduled), new Date());
            // let dateInfo = recencyInWeeks===-1 ? "two weeks ago" : "last week"; 

          

            let higherScore = teamScore > opposingScore ? teamScore : opposingScore;
            let lowerScore = teamScore <= opposingScore ? teamScore : opposingScore;

            console.log(`${GOOGLE_NEWS_API_BASE_URL}everything?apiKey=${GOOGLE_NEWS_API_KEY}&q=`+teamName.split(' ')[1]+"+"+opposingName.split(' ')[1]+"+"+higherScore+"-"+lowerScore)

            // ***************** TO DO: PUT THIS IN A FUNCTION ***************** //
            request({
                 "url": `${GOOGLE_NEWS_API_BASE_URL}everything?apiKey=${GOOGLE_NEWS_API_KEY}&q=`+teamName.split(' ')[1]+"+"+opposingName.split(' ')[1]+"+"+higherScore+"-"+lowerScore,
                 "method": "GET"
                }, (err, res, body) => {



                let articles = JSON.parse(body).articles;
                let numArticles = articles.length;

                 if (numArticles > 0) {
                    console.log("\n\nHere are the latest headlines for the".green.bold+" "+team.green.bold+":");
                    for (var i=0; i < numArticles; i++) {

                        if (articles[i].title && articles[i].description && articles[i].content && (articles[i].title.includes(higherScore+"-"+lowerScore) || articles[i].description.includes(higherScore+"-"+lowerScore) ||
                            articles[i].content.includes(higherScore+"-"+lowerScore))) {
                            

                            // ***************** TO DO: FORMAT THIS NICELY SO PRINTS PRETTY IN CONSOLE ***************** //
                            console.log(articles[i]);
                        }
                    }
                    
                } else {
                    console.log("\n\n"+"Hmm...I'm pretty dumb so I didn't find anything recent on the ".white.bold.bgRed+team.white.bold.bgRed+". Try asking Google!".white.bold.bgRed+"\n\n");
                     
                }
            
                 if (err){
                     console.log("News API Error: ", err);
                 }
            });

            // Respond according to how big the win/loss was
            // if (teamScore >= opposingScore + 14) {

            //     console.log("The "+teamName+" TOTALLY SMACKED the "+opposingName+" by a score of "+teamScore+" to "+opposingScore+" "+dateInfo+"!!!");

            // } else if (teamScore >= opposingScore + 10 && teamScore < opposingScore + 14) {

            //     console.log("The "+teamName+" handily beat the "+opposingName+" "+teamScore+" to "+opposingScore+" "+dateInfo+".");

            // } else if (teamScore >= opposingScore + 7 && teamScore < opposingScore + 10) {

            //     console.log("The "+teamName+" eeked out a "+teamScore+" to "+opposingScore+" win over the "+opposingName+" "+dateInfo+".")

            // } else if (teamScore + 14 <= opposingScore) {

            //     console.log("The "+teamName+" got DEMOLISHED the "+opposingName+" by a score of "+opposingScore+" to "+teamScore+" "+dateInfo+". Sucks to suck!!!");

            // } else if (teamScore + 10 <= opposingScore && teamScore > opposingScore + 14) {


            //     console.log("The "+teamName+" lost to the "+opposingName+" "+opposingScore+" to "+teamScore+" "+dateInfo+".");


            // } else if (teamScore + 7 <= opposingScore && teamScore > opposingScore + 10) {


            //     console.log("The "+teamName+" fell short to the "+opposingName+" in a close "+opposingScore+" to "+teamScore+" loss"+" "+dateInfo+".");

            // } else {


            //     console.log("The "+teamName+" were on the losing end of a nail-biter to the "+opposingName+" with a final score of "+opposingScore+" to "+teamScore+" "+dateInfo+".");

            // }


        }


    }

    if (!teamFound) {
        getPrevWeekScore(team, schedule, prevWeek-1);

    }


}


// returns -1 for before this past nfl weekend, 0 for this past nfl weekend
function weeksBetween(gameDate, currDate) {
 
    return Math.round((gameDate - currDate) / (7 * 24 * 60 * 60 * 1000));
}


// returns function to sort JSON objects by a particular property
function sortByProperty (property) {
    return function (x, y) {
        return ((x[property] === y[property]) ? 0 : ((x[property] > y[property]) ? 1 : -1));
    };
};
// // these are in UTC which is 5 hrs ahead of EST
// var x = [{"date": "2019-11-11T01:20:00+00:00"},{"date": "2019-11-10T21:05:00+00:00"},{"date": "2019-11-12T01:15:00+00:00"}]
// console.log(x.sort(sortByProperty('date')));



// gets latest news for a team or player and returns json object containing said news info
function getTheLatest(data, queryType) {

    // get name of team or player or city from the data user enters
    let name = extractName(data, queryType);
    let context;

    //check context stack
    const loadContext = snap => {
      if (snap.val()) {
        context = snap.val();
      }
    }

    db.ref('/context-stack/0/sport').on('value', loadContext, error => console.log(error));

    // depending on the query type, make that kind of request
    if (queryType==="howDidTheBlankDo") {

        // get sport you think it is based on knowledge base
        let sport = whichSport(name)
        console.log('queryType, sport: ',queryType,sport)


        // if context-stack empty
        if (context==="none") {


            if (sport==="nfl") {

                // push sport to context-stack
                db.ref('/context-stack/0/').set({
                    sport: sport,
                    queryType: queryType
                });

                // want previous week's score or current score
                getNFLScoresOrStandings(name, queryType);
            } else {
                db.ref('/context-stack/0/').set({
                    sport: sport,
                    queryType: queryType
                });
                
                getNBAScoresOrStandings(name,queryType)
                console.log('context===none, getting nba scores/standings for ',name ,queryType)
            }

        } else {

            // if context-stack isn't the same as your knowledge base, prefer knowledge base
            if (context!=sport) {

                if (sport==="nfl") {

                    // push sport to context-stack
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: queryType
                    });

                    // want previous week's score or current score
                    getNFLScoresOrStandings(name, queryType);
                } else {
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: queryType
                    });
                   
                    getNBAScoresOrStandings(name,queryType)
                    console.log('context!=knowledgeBase, getting nba scores/standings for ',name,queryType)
                }

            } else {

                if (sport==="nfl") {
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: queryType
                    });

                    // want previous week's score or current score
                    getNFLScoresOrStandings(name, queryType);
                } else {
                    
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: queryType
                    });
                    getNBAScoresOrStandings(name,queryType)
                    console.log('context===knowledgeBase, getting nba scores/standings for ',name,queryType)
                }

            }

        }
        

    } else if (queryType==="howAreTheBlankDoing") {

        // get sport you think it is based on knowledge base
        let sport = whichSport(name)
        console.log('queryType, sport: ',queryType,sport)


        // if context-stack empty
        if (context==="none") {


            if (sport==="nfl") {

                // push sport to context-stack
                db.ref('/context-stack/0/').set({
                    sport: sport,
                    queryType: queryType
                });

                // want previous week's score or current score
                getNFLScoresOrStandings(name, queryType);
            } else {
                db.ref('/context-stack/0/').set({
                    sport: sport,
                    queryType: queryType
                });
                
                getNBAScoresOrStandings(name,queryType)
                console.log('context===none, getting nba scores/standings for ',name,queryType)
            }

        } else {

            // if context-stack isn't the same as your knowledge base, prefer knowledge base
            if (context!=sport) {

                if (sport==="nfl") {

                    // push sport to context-stack
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: queryType
                    });

                    // want previous week's score or current score
                    getNFLScoresOrStandings(name, queryType);
                } else {
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: queryType
                    });
                    
                    getNBAScoresOrStandings(name,queryType)
                    console.log('context!=knowledgeBase, getting nba scores/standings for ',name,queryType)
                }

            } else { // if context-stack and knowledge base agree, then continue

                if (sport==="nfl") {

                    // push sport to context-stack
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: queryType
                    });
                    // want previous week's score or current score
                    getNFLScoresOrStandings(name, queryType);
                } else {

                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: queryType
                    });
                    
                    getNBAScoresOrStandings(name,queryType)
                    console.log('context==sport, getting nba scores/standings for ',name,queryType)
                }

            }

        }


    } else if (queryType==="howDidBlankDo") {


        // need to check if the relevant name in the query is a team, player, or city
        if (isTeam(name)) {

            // get sport you think it is based on knowledge base
            let sport = whichSport(name)
            console.log('queryType, sport: ',queryType,sport)


            // if context-stack empty
            if (context==="none") {


                if (sport==="nfl") {

                    // push sport to context-stack
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: queryType
                    });

                    // want previous week's score or current score
                    getNFLScoresOrStandings(name, queryType);
                } else {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: queryType
                        });

                        getNBAScoresOrStandings(name,queryType)
                        console.log('context===none, getting nba scores/standings for ',name,queryType)
                }

            } else {

                // if context-stack isn't the same as your knowledge base, prefer knowledge base
                if (context!=sport) {

                    if (sport==="nfl") {

                        // push sport to context-stack
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: queryType
                        });

                        // want previous week's score or current score
                        getNFLScoresOrStandings(name, queryType);
                    } else {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: queryType
                        });
                        
                        getNBAScoresOrStandings(name,queryType)
                        console.log('context!=knowledgeBase, getting nba scores/standings for ',name,queryType)
                    }

                } else { // if context-stack and knowledge base agree, then continue

                    if (sport==="nfl") {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: queryType
                        });
                        // want previous week's score or current score
                        getNFLScoresOrStandings(name, queryType);
                    } else {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: queryType
                        });
                        getNBAScoresOrStandings(name,queryType)
                        console.log('context===knowledgeBase, getting nba scores/standings for ',name,queryType)
                    }


                }

            } 


        } else if (isPlayer(name)[0]) {

            let sport = isPlayer(name)[2];
            console.log('queryType, sport: ',queryType,sport)
            if (sport==="nfl") {
                console.log('nfl player!')

                // push sport to context-stack
                db.ref('/context-stack/0/').set({
                    sport: sport,
                    queryType: queryType
                });

                // if it's a player we want an article on how the player did
                getNFLPlayerNews(name, isPlayer(name)[1])
            } else {
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: queryType
                    });

                    getNBAPlayerNews(name, isPlayer(name)[1]);


                    
            }

            

        } else if (isCity(name)) {

            /* if it's a city then: 
             1. check context stack for the sport
             2. check which sport is on (optional)
             3. get scores/standings news from the team from that city with that sport*/

             console.log('city!')
             // if context-stack empty, ask which league
            if (context==="none") {
                console.log('Is this team in the NFL or NBA?')
                db.ref('/context-stack/0/').update({
                    city: name
                });
            } else {

                let team = teamFromCity(context, name)
                let sport = whichSport(team)

                // if context-stack isn't the same as your knowledge base, prefer knowledge base
                if (context!=sport) {

                    if (sport==="nfl") {

                        // push sport to context-stack
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: queryType
                        });

                        // want previous week's score or current score
                        getNFLScoresOrStandings(name, queryType);
                    } else {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: queryType
                        });

                        getNBAScoresOrStandings(name,queryType)
                        console.log('context!=knowledgeBase, getting nba scores/standings for ',team,queryType)
                    }

                } else { // if context-stack and knowledge base agree, then continue

                    if (sport==="nfl") {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: queryType
                        });
                        // want previous week's score or current score
                        getNFLScoresOrStandings(name, queryType);
                    } else {
                        
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: queryType
                        });
                        getNBAScoresOrStandings(name,queryType)
                        console.log('context===knowledgeBase, getting nba scores/standings for ',team, queryType)
                    }

                }


            }
            

        }




    } else if (queryType==="whatAboutBlank") {

        // check if the context stack is empty

        // if it is NOT then pop the object at the top and examine 
        // 1. what sport is it
        // 2. what was most recent queryType ******** BASED ON THAT WE WANT TO CALL FUNCTIONS W CERTAIN OTHER QUERY TYPES
        // 3. get news about that team/player/city
        console.log('name, queryType'+name+queryType)


        let prevQueryType;

        const loadPrevQueryType = snap => {
            if (snap.val()) {
                prevQueryType = snap.val()
                console.log('prevQueryType: ',prevQueryType)
            }
        }

        db.ref('/context-stack/0/queryType/').on('value', loadPrevQueryType, (e) => console.log(e));





        // need to check if the relevant name in the query is a team, player, or city
        if (isTeam(name)) {

            // get sport you think it is based on knowledge base
            let sport = whichSport(name)
            console.log('queryType, sport: ',queryType,sport)


            // if context-stack empty
            if (context==="none") {


                if (sport==="nfl") {

                    // push sport to context-stack
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType: prevQueryType
                    });

                    // want previous week's score or current score
                    getNFLScoresOrStandings(name, prevQueryType);
                } else {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: prevQueryType
                        });

                        getNBAScoresOrStandings(name,prevQueryType)
                        console.log('context===none, getting nba scores/standings for ',name,queryType)
                }

            } else {

                // if context-stack isn't the same as your knowledge base, prefer knowledge base
                if (context!=sport) {

                    if (sport==="nfl") {

                        // push sport to context-stack
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: prevQueryType
                        });

                        // want previous week's score or current score
                        getNFLScoresOrStandings(name, prevQueryType);
                    } else {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: prevQueryType
                        });
                        
                        getNBAScoresOrStandings(name,prevQueryType)
                        console.log('context!=knowledgeBase, getting nba scores/standings for ',name,queryType)
                    }

                } else { // if context-stack and knowledge base agree, then continue

                    if (sport==="nfl") {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: prevQueryType
                        });
                        // want previous week's score or current score
                        getNFLScoresOrStandings(name, prevQueryType);
                    } else {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: prevQueryType
                        });
                        getNBAScoresOrStandings(name,prevQueryType)
                        console.log('context===knowledgeBase, getting nba scores/standings for ',name,queryType)
                    }


                }

            } 


        } else if (isPlayer(name)[0]) {

            let sport = isPlayer(name)[2];
            console.log('queryType, sport: ',queryType,sport)
            if (sport==="nfl") {
                console.log('nfl player!')

                // push sport to context-stack
                db.ref('/context-stack/0/').set({
                    sport: sport,
                    queryType: 'howDidBlankDo'
                });

                // if it's a player we want an article on how the player did
                getNFLPlayerNews(name, isPlayer(name)[1])
            } else {
                    db.ref('/context-stack/0/').set({
                        sport: sport,
                        queryType:'howDidBlankDo'
                    });

                    getNBAPlayerNews(name, isPlayer(name)[1]);


                    
            }

            

        } else if (isCity(name)) {

            /* if it's a city then: 
             1. check context stack for the sport
             2. check which sport is on (optional)
             3. get scores/standings news from the team from that city with that sport*/
             console.log('city!')
             // if context-stack empty, ask which league
            if (context==="none") {
                console.log('Is this team in the NFL or NBA?')
                db.ref('/context-stack/0/').update({
                    city: name
                });
            } else {

                let team = teamFromCity(context, name)
                let sport = whichSport(team)

                // if context-stack isn't the same as your knowledge base, prefer knowledge base
                if (context!=sport) {

                    if (sport==="nfl") {

                        // push sport to context-stack
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: prevQueryType
                        });

                        // want previous week's score or current score
                        getNFLScoresOrStandings(team, prevQueryType);
                    } else {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: prevQueryType
                        });

                        getNBAScoresOrStandings(team,prevQueryType)
                        console.log('context!=knowledgeBase, getting nba scores/standings for ',team,queryType)
                    }

                } else { // if context-stack and knowledge base agree, then continue

                    if (sport==="nfl") {
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: prevQueryType
                        });
                        // want previous week's score or current score
                        getNFLScoresOrStandings(team, prevQueryType);
                    } else {
                        
                        db.ref('/context-stack/0/').set({
                            sport: sport,
                            queryType: prevQueryType
                        });
                        getNBAScoresOrStandings(team,prevQueryType)
                        console.log('context===knowledgeBase, getting nba scores/standings for ',team, queryType)
                    }

                }


            }
            

        }
        







    }

}