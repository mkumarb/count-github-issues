var express = require('express');
var request = require('request');

app = express();

var options = {
    ///https://api.github.com/repos/:owner/:repo/issues
    url: 'https://api.github.com/repos/toddmotto/public-apis/issues',
    headers: {
        'User-Agent': 'Github open issues',
        'Content-type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
    },
    qs: {
        state: 'open',
        per_page: 30,
        page: 1
    }
};

app.get('/', function(req,res){
    var all_open_issues = [];
    var open_issues = [];
    var issuesProcessed = 0;
    var r = request.get(options,function(error,response,body){
        if(r.responseContent.headers.link){
            console.log("We have a next page!");
            console.log(r.responseContent.headers.link);
        }else{
            console.log("We do not have a next page!");
        }
        all_open_issues = JSON.parse(body);
        res.send(all_open_issues);
        // if(!error && response.statusCode == 200){
        //     all_open_issues = JSON.parse(body);
        //     all_open_issues.forEach(issue => {
        //         issuesProcessed++;
        //         if(!issue.hasOwnProperty('pull_request')){
        //             open_issues.push(issue);
        //         } 
        //         if(issuesProcessed === all_open_issues.length){
        //             console.log("Total number of open issues: ",open_issues.length);
        //             res.send(r);
        //         }
        //     });   
        // } else {
        //     console.log("Request failed with error: ", error);
        //     res.send(r);
        // }
        // res.send(body)
    })
})

app.listen(process.env.PORT || 3000, function(){
    console.log("Server has started!!");
});