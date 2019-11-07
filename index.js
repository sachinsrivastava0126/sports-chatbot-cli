'use strict';

const GOOGLE_NEWS_API_BASE_URL = 'https://newsapi.org/v2/';
const GOOGLE_NEWS_API_KEY = 'e4c8bfe9aacf4ec0982da7220a8ca021';

// const fs = require('fs'); // this is for reading in from data.json which doesn't work for some reason
const request = require('request');
const https = require('https');
const colors = require('colors');



/*

    NOV. 6 CLASS NOTES:
    - WE STILL WANT NEWS STORIES SO INSTEAD OF JUST RETURNING SCORE OR STANDINGS RETURN NEWS STORY MAYBE USING
    THAT INFO?
    - SET UP FIREBASE


*/




//read in data
//****** TO-DO: NEED TO FIGURE OUT HOW TO READ THIS FROM FILE INSTEAD OF DOING THIS *****//// 
let allData = {
    "nfl": {
        "teams": 
        [
            {
                "team_id" : "new-england-patriots",
                "abbreviation" : "NE",
                "conference" : "AFC",
                "division": "east",
                "first_name" : "New England",
                "last_name" : "Patriots",
                "nick_name" : "Pats",
                "city" : "New England",
                "full_name" : "New England Patriots",
                "players": [
                    {
                        "last_name" : "Brady",
                        "first_name": "Tom",
                        "display_name": "Tom Brady",
                        "position": "QB",
                        "uniform_number": 12,
                    },
                    {
                        "last_name" : "White",
                        "first_name": "James",
                        "display_name": "James White",
                        "position": "RB",
                        "uniform_number": 28,
                    },
                    {
                        "last_name" : "Edelman",
                        "first_name": "Julian",
                        "display_name": "Julian Edelman",
                        "position": "WR",
                        "uniform_number": 11,
                    },
                ]
            },
            {
                "team_id" : "baltimore-ravens",
                "abbreviation" : "BAL",
                "conference" : "AFC",
                "division": "north",
                "first_name" : "Baltimore",
                "last_name" : "Ravens",
                "nick_name" : "Ravens",
                "city" : "Baltimore",
                "full_name" : "Baltimore Ravens",
                "players": [
                    {
                        "last_name" : "Jackson",
                        "first_name": "Lamar",
                        "display_name": "Lamar Jackson",
                        "position": "QB",
                        "uniform_number": 8,
                    },
                    {
                        "last_name" : "Ingram",
                        "first_name": "Mark",
                        "display_name": "Mark Ingram",
                        "position": "RB",
                        "uniform_number": 21,
                    },
                    {
                        "last_name" : "Brown",
                        "first_name": "Marquise",
                        "display_name": "Marquise Brown",
                        "position": "WR",
                        "uniform_number": 15,
                    },
                ]
            },
            {
                "team_id" : "dallas-cowboys",
                "abbreviation" : "DAL",
                "conference" : "NFC",
                "division": "east",
                "first_name" : "Dallas",
                "last_name" : "Cowboys",
                "nick_name" : "The Boys",
                "city" : "Dallas",
                "full_name" : "Dallas Cowboys",
                "players": [
                    {
                        "last_name" : "Prescott",
                        "first_name": "Dak",
                        "display_name": "Dak Prescott",
                        "position": "QB",
                        "uniform_number": 4,
                    },
                    {
                        "last_name" : "Elliot",
                        "first_name": "Ezekiel",
                        "display_name": "Ezekiel Elliot",
                        "position": "RB",
                        "uniform_number": 21,
                    },
                    {
                        "last_name" : "Cooper",
                        "first_name": "Amari",
                        "display_name": "Amari Cooper",
                        "position": "WR",
                        "uniform_number": 19,
                    },
                ]
            }
        ]
    },
    "mlb": {},
    "nba": {},
    "nhl": {}
};




//// Sports Radar API keys ////
const SPORTS_RADAR_MLB_API_KEY = 'gaqjbcjhzw9u2cbcwxxgpadd';
const SPORTS_RADAR_NBA_API_KEY = 'cgz6qzb66rvsupc554j23px9';
const SPORTS_RADAR_NFL_API_KEY = '2mkne3w4rbx39avqk9whkm73';
const SPORTS_RADAR_NHL_API_KEY = 'm7zfrvkj86j964gv7rn2twkg';

//base url
const SPORTS_RADAR_NFL_API_BASE_URL = 'api.sportradar.us';






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
        
        // Check what kind of query the user has made
        let queryType = checkQueryType(data);


        // Get relevant news given data and queryType
        getTheLatest(data, queryType);

    }
});






// checks what kind of query user has entered and returns string corresponding to query type
// uses simple regex
function checkQueryType (q) {
    const howDidTheBlankDo = /How\sdid\sthe\s([^\s]+)\sdo\?/;
    const howDidBlankDo = /How\sdid\s([^\s]+)\sdo\?/;
    const howAreTheBlankDoing = /How\sare\sthe\s([^\s]+)\sdoing\?/;
    const whatAboutBlank = /What\sabout\s([^\s]+)\?/;

    let isHowDidTheBlankDo = howDidTheBlankDo.test(q);
    let isHowAreTheBlankDoing = howAreTheBlankDoing.test(q);
    let isWhatAboutBlank = whatAboutBlank.test(q);

    if (isHowDidTheBlankDo) {
        return 'howDidTheBlankDo';
    } else if (isHowAreTheBlankDoing) {
        return 'howAreTheBlankDoing';
    } else if (howDidBlankDo) {
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
        return s.split('about ')[1];
    }

}

// check if name is a player
function isPlayer(s) {
    let allPlayers = [];
    let allTeams = allData.nfl.teams;
    let numTeams = allTeams.length;

    for (var i = 0; i < numTeams; i++) {

        if (allTeams[i].players.length>0) {
            let numTeamPlayers = allTeams[i].players.length;

            for (var j = 0; j < numTeamPlayers; j++) {

                allPlayers.push(allTeams[i].players[j].display_name);

            }
        }

    }

    if (allPlayers.includes(s)) {
        return true;
    }

    return false;

}

// check if name is a team
function isTeam(s) {
    let allTeamNames = [];
    let allTeams = allData.nfl.teams;
    let numTeams = allTeams.length;

    for (var i = 0; i < numTeams; i++) {
        allTeamNames.push(allTeams[i].full_name);
        allTeamNames.push(allTeams[i].nick_name);
    }

    if (allTeamNames.includes(s)) {
        return true;
    }

    return false;

}

// check if name is a city
function isCity(s) {
    let allCities = [];
    let allTeams = allData.nfl.teams;
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


// checks if there is a game on for given team and returns true if so else false
function getScoresOrStandings(team, queryType) {
    console.log('team to search for: ',team);

    //we can get the year and season-type from the available seasons endpoint (get the last JSON object that is returned)
    let currYear = new Date().getFullYear().toString();
    let currSeasonType;

    const seasonsOptions = {
        hostname: SPORTS_RADAR_NFL_API_BASE_URL,
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
                    hostname: SPORTS_RADAR_NFL_API_BASE_URL,
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
                                    if (queryType==="howDidTheBlankDo") {

                                        getPrevWeekScore(team, schedule, currWeek-2);

                                    } else if (queryType==="howAreTheBlankDoing") {


                                        getStandings(team, currYear);

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

                                getStandings(team, currYear);

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
function getStandings(team, currYear) {

    const standingsOptions = {
        hostname: SPORTS_RADAR_NFL_API_BASE_URL,
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
                                let streakType = afc.divisions[i].teams[j].streak.type==="loss"? "losing" : "winning";
                                let streakLength = afc.divisions[i].teams[j].streak.length;

                                let wins = afc.divisions[i].teams[j].wins;
                                let losses = afc.divisions[i].teams[j].losses;




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
            let dateInfo = recencyInWeeks===-1 ? "two weeks ago" : "last week"; 

          

            // Respond according to how big the win/loss was
            if (teamScore >= opposingScore + 14) {

                console.log("The "+teamName+" TOTALLY SMACKED the "+opposingName+" by a score of "+teamScore+" to "+opposingScore+" "+dateInfo+"!!!");

            } else if (teamScore >= opposingScore + 10 && teamScore < opposingScore + 14) {

                console.log("The "+teamName+" handily beat the "+opposingName+" "+teamScore+" to "+opposingScore+" "+dateInfo+".");

            } else if (teamScore >= opposingScore + 7 && teamScore < opposingScore + 10) {

                console.log("The "+teamName+" eeked out a "+teamScore+" to "+opposingScore+" win over the "+opposingName+" "+dateInfo+".")

            } else if (teamScore + 14 <= opposingScore) {

                console.log("The "+teamName+" got DEMOLISHED the "+opposingName+" by a score of "+opposingScore+" to "+teamScore+" "+dateInfo+". Sucks to suck!!!");

            } else if (teamScore + 10 <= opposingScore && teamScore > opposingScore + 14) {


                console.log("The "+teamName+" lost to the "+opposingName+" "+opposingScore+" to "+teamScore+" "+dateInfo+".");


            } else if (teamScore + 7 <= opposingScore && teamScore > opposingScore + 10) {


                console.log("The "+teamName+" fell short to the "+opposingName+" in a close "+opposingScore+" to "+teamScore+" loss"+" "+dateInfo+".");

            } else {


                console.log("The "+teamName+" were on the losing end of a nail-biter to the "+opposingName+" with a final score of "+opposingScore+" to "+teamScore+" "+dateInfo+".");

            }


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

    // get name of team or player from the data user enters
    let name = extractName(data, queryType);

    // depending on the query type, make that kind of request
    if (queryType==="howDidTheBlankDo") {

        // want previous week's score or current score
        getScoresOrStandings(name, queryType);

        

    } else if (queryType==="howAreTheBlankDoing") {

        // want standings or current score
        getScoresOrStandings(name, queryType);


    } else if (queryType==="howDidBlankDo") {

        // need to check if the relevant name in the query is a team, player, or city
        if (isTeam(name)) {

            // 1. need to check if game on
            // 2. if game on then return score
            // 3. if game not on then return recent news
            


        } else if (isPlayer(name)) {

        } else if (isCity(name)) {

        }




    } else if (queryType==="whatAboutBlank") {

        // check if the context stack is empty

        // if it is NOT then pop the object at the top and examine 
        // 1. what sport is it
        // 2. find team/player in that sport
        // 3. get news about that team/player


    }

}