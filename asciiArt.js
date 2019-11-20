'use strict';

var cliFrames = require("cli-frames");
const terminalImage = require('terminal-image');


let shot = 
"          o              \n"+
"/|   o         o         \n"+
"\\|=--            o       \n"+
"   ##				      \n"+
"                   \\\\    \n"+
"                /   \\O   \n"+
"               O_/   T   \n"+
"               T    /|   \n"+
"               |\\  | |   \n"+
"_______________|_|_______\n";





const frames = [
"                         \n"+
"/|                       \n"+
"\\|=--            o       \n"+
"   ##				      \n"+
"                   \\\\    \n"+
"                /   \\O   \n"+
"               O_/   T   \n"+
"               T    /|   \n"+
"               |\\  | |   \n"+
"_______________|_|_______\n",


"                         \n"+
"/|             o         \n"+
"\\|=--                    \n"+
"   ##				      \n"+
"                   \\\\    \n"+
"                /   \\O   \n"+
"               O_/   T   \n"+
"               T    /|   \n"+
"               |\\  | |   \n"+
"_______________|_|_______\n",



"          o              \n"+
"/|                       \n"+
"\\|=--                    \n"+
"   ##				      \n"+
"                   \\\\    \n"+
"                /   \\O   \n"+
"               O_/   T   \n"+
"               T    /|   \n"+
"               |\\  | |   \n"+
"_______________|_|_______\n",



"                         \n"+
"/|   o                   \n"+
"\\|=--                    \n"+
"   ##				      \n"+
"                   \\\\    \n"+
"                /   \\O   \n"+
"               O_/   T   \n"+
"               T    /|   \n"+
"               |\\  | |   \n"+
"_______________|_|_______\n",




"                         \n"+
"/|                       \n"+
"\\|=--                    \n"+
"  #o#				      \n"+
"                   \\\\    \n"+
"                /   \\O   \n"+
"               O_/   T   \n"+
"               T    /|   \n"+
"               |\\  | |   \n"+
"_______________|_|_______\n"];


// new cliFrames({
//     frames: ["5", "4", "3", "2", "1"]
//   , autostart: {
//         delay: 1000
//       , end: function (err, data) {
//             // Create another animation
//             var animation = new cliFrames();
//             animation.load(frames);
//             animation.start({
//                 repeat: true
//               , delay: 250
//             });
//         }
//     }
// });
// var nbaAnimation = new cliFrames();
// 	nbaAnimation.load(frames);
// 	nbaAnimation.start({
// 	    repeat: true
// 	  , delay: 250
// });


(async () => {
	console.log(await terminalImage.file('nfl.gif'));
	// console.log(await terminalImage.file('nba.gif'));
})();