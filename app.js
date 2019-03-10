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
        per_page: 100,
        page: 1
    }
};

function getPageCount(returnValue){
    request.get(options,function(error,response,body){
        link_urls = response.headers.link
        if(link_urls === undefined){
            returnValue(1);
        }else {
            link_urls.split(',').forEach((api_link) => {
                if(api_link.indexOf('rel="last"')>=0)
                    returnValue(parseInt(api_link[api_link.indexOf('&page=')+6]));
            })
        }
    })
}

var getAllOpenIssues = function(i, optionsNew, pageCount, all_open_issues, returnOpenIssueList) {
    optionsNew.qs.page = i;
    request.get(optionsNew,function(error,response,body){
        if(!error && response.statusCode == 200){
            all_open_issues = [...all_open_issues,...JSON.parse(body)];
            if(i===pageCount){
                returnOpenIssueList(all_open_issues)
            }else{
                getAllOpenIssues(i+1, optionsNew, pageCount, all_open_issues, returnOpenIssueList)
            }  
        } else {
            console.log("Request failed with error: ", error);
            res.send(error);
        }
    })
}

app.get('/', function(req,res){
    var all_open_issues = [];
    var open_issues = [];
    getPageCount(function(pageCount){
        console.log("Page Count: ",pageCount);
        getAllOpenIssues(1, options, pageCount, all_open_issues, function(all_open_issues){
            this.all_open_issues = all_open_issues;
            res.send(this.all_open_issues);
        })
    });
})

    // var r = request.get(options,function(error,response,body){
        
    //     link_urls = r.responseContent.headers.link;
    //     console.log("Link header urls: ",r.responseContent.headers.link)
    //     if(!error && response.statusCode == 200){
    //         all_open_issues = [...JSON.parse(body)];
    //         console.log("Issue count: ",all_open_issues.length)
    //         all_open_issues.forEach(issue => {
    //             // console.log("In for loop")
    //             issuesProcessed++;
    //             if(!issue.hasOwnProperty('pull_request')){
    //                 open_issues.push(issue);
    //             } 
    //             if((issuesProcessed === all_open_issues.length) && link_urls===undefined){ //
    //                 console.log("Total number of open issues: ",open_issues.length);
    //                 console.log("Issues processed: ", issuesProcessed)
    //                 return open_issues;
    //             } else if((issuesProcessed === all_open_issues.length) && link_urls!==undefined){ //
                    
    //                 console.log(options.qs)
    //                 getOpenIssues(options, open_issues)
    //             }
    //         });   
    //     } else {
    //         console.log("Request failed with error: ", error);
    //         res.send(error);
    //     }
    // })




app.listen(process.env.PORT || 3000, function(){
    console.log("Server has started!!");
});