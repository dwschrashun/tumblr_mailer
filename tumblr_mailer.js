//add modules
var fs = require("fs");
var ejs = require("ejs");
var tumblr = require("tumblr.js");
var mandrill = require('mandrill-api/mandrill');

// Authenticate APIs - enter your own api keys for mandrill and tumblr here
var mandrill_client = new mandrill.Mandrill('MANDRILL_KEY');
var client = tumblr.createClient({
  consumer_key: 'CONSUMER_KEY',
  consumer_secret: 'CONSUMER_SECRET',
  token: 'TOKEN',
  token_secret: 'TOKEN_SECRET'
});

//must provide a list of contacts in "friend_list.csv" with entries for first name, last name, months since last contact and email 
//must provide an email template in "template.ejs" which will be rendered using contact and tumblr information
//reads files into strings
var csvFile = fs.readFileSync("friend_list.csv","utf8");
var ejsTemplateStr = fs.readFileSync("template.ejs", "utf-8");

//parses string read from csv to creates an array of objects
//each object represents one person
var csvParse = function (csv) {
	var strArr = csv.split("\n");
	var entryArr = [];
	var createEntry = function (entryStr) {
		var paramArr = entryStr.split(",");
		this.firstName = paramArr[0];
		this.lastName = paramArr[1];
		this.numMonthsSinceContact = paramArr[2];
		this.emailAddress = paramArr[3];
		this.fullName = paramArr[0] + " " + paramArr[1];
		this.latestPosts = [];

	}
	for (var i = 1; i < strArr.length; i++) {
		entryArr.push(new createEntry(strArr[i]));
	}
	return entryArr;
}

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
	var message = {
	    "html": message_html,
	    "subject": subject,
	    "from_email": from_email,
	    "from_name": from_name,
	    "to": [{
	            "email": to_email,
	            "name": to_name
	        }],
	    "important": false,
	    "track_opens": true,    
	    "auto_html": false,
	    "preserve_recipients": true,
	    "merge": false,
	    "tags": [
	        "Fullstack_Tumblrmailer_Workshop"
	    ]    
	};
	var async = false;
	var ip_pool = "Main Pool";
	mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
	    // console.log(message);
	    console.log(result);   
	}, function(e) {
	    // Mandrill returns the error as an object with name and message keys
	    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
	});
}

var csvArr = csvParse(csvFile);
var theDate = new Date();
var stamp = Math.floor(theDate.getTime()/1000);
var sevenDays = 7*24*60*60;
var customTemplate = "";
var templateArr = [];

//replace with your information
var myEmail = "";
var myName = "";
var subjectLine = "";

var sendBatchEmail = function (list) {
	for (var i = 0; i < list.length; i++) {
		sendEmail(list[i].fullname,list[i].emailAddress,myName,myEmail,subjectLine,templateArr[i]);
	}
}

//enter the uri for your tumblr here to retrive alist of posts
client.posts('XXXXXXX.tumblr.com', function(err, response){
	// {timestamp > stamp - sevenDays}
	//response.post is an array of post objects
	// populate latestPosts
	var timeDiff = 0;
	var postsArr = [];
	for (var i = 0; i < response.posts.length; i++) {
		var sevenDays = 7*24*60*60;
		timeDiff = stamp - response.posts[i].timestamp;
		if (timeDiff < sevenDays) {
			postsArr.push(response.posts[i]);
		}
	}
	for (var k = 0; k < csvArr.length; k++) {
		csvArr[k].latestPosts = postsArr;
		templateArr[k] = ejs.render(ejsTemplateStr, csvArr[k]);
	}
	sendBatchEmail(csvArr);
});
