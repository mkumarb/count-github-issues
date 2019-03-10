var express = require('express');
var request = require('request');

app = express();

var options = {
    ///https://api.github.com/repos/:owner/:repo/issues
    url: 'https://api.github.com/repos/toddmotto/public-apis/issues',
    headers: {
      'User-Agent': 'request',
      'Content-type': 'application/json'
    },
    qs: {
        state: 'open'
    }
};

app.get('/', function(req,res){
    // open_issues:any = [];
    // var issuesProcessed = 0;
    request.get(options,function(err,req,body){
        // issuesProcessed++;
        // body.forEach(issue => {
        //     if(!issue.hasOwnProperty('pull_request'))
        //         open_issues.push(issue);
        // });
        // if(issuesProcessed === body.length)
        //     res.send(open_issues);
        if(!error && response.statusCode == 200){
            res.json(body);
        }
        // res.send(body)
    })
})

app.listen(process.env.PORT || 3000, function(){
    console.log("Server has started!!");
});