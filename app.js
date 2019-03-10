var express     = require('express'),
    request     = require('request'),
    bodyParser  = require("body-parser");

app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/static', express.static('static'))

var options = {
    ///https://api.github.com/repos/:owner/:repo/issues
    url: 'https://api.github.com/repos/mohanb9/count-github-issues/issues',
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
        if(!error && response.statusCode == 200){
            link_urls = response.headers.link
            if(link_urls === undefined){
                returnValue(1);
            }else {
                link_urls.split(',').forEach((api_link) => {
                    if(api_link.indexOf('rel="last"')>=0)
                        returnValue(parseInt(api_link[api_link.indexOf('&page=')+6]));
                })
            }
        } else {
            returnValue(-1);
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
            console.log("Request failed with error: ", JSON.parse(body));
        }
    })
}

var removePullRequestsAndGetIssueCount = function(all_issues,returnOpenIssuesCount){
    issuesProcessed = 0;
    var open_issues = [];
    var sevenDaysOldIssues = 0, twentyFourHourOldIssues = 0;
    all_issues.forEach(issue => {
        issuesProcessed++;
        if(!issue.hasOwnProperty('pull_request')){
            open_issues.push(issue);
            var issueCreateDate = new Date(issue.created_at);
            var oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            var sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if(issueCreateDate.getTime() > oneDayAgo.getTime()){
                twentyFourHourOldIssues++;
            } else if(issueCreateDate.getTime() > sevenDaysAgo.getTime()){
                sevenDaysOldIssues++;
            } 
            if(issuesProcessed === all_issues.length){
                var issueCount = {
                    allOpenIssues: open_issues.length,
                    twentyFourHourOld: twentyFourHourOldIssues,
                    betweenOneAndSevenDaysOld: sevenDaysOldIssues - twentyFourHourOldIssues,
                    olderThanSevenDays: open_issues.length - sevenDaysOldIssues
                }
                returnOpenIssuesCount(open_issues, issueCount);
            }
        } else {
            if(issuesProcessed === all_issues.length){
                var issueCount = {
                    allOpenIssues: open_issues.length,
                    twentyFourHourOld: twentyFourHourOldIssues,
                    betweenOneAndSevenDaysOld: sevenDaysOldIssues - twentyFourHourOldIssues,
                    olderThanSevenDays: open_issues.length - sevenDaysOldIssues
                }
                returnOpenIssuesCount(open_issues, issueCount);
            }
        }
    })
}

app.post('/', function(req,res){
    options.qs.page=1;
    var all_open_issues = [];
    repositoryURL = req.body.repoURL;
    var pos = repositoryURL.indexOf("github.com")
    if(pos >= 0){
        apiURL = "https://api.github.com/repos"+repositoryURL.substr(pos+10)+"/issues";
        options.url = apiURL;
        getPageCount(function(pageCount){
            if(pageCount > 0){
                getAllOpenIssues(1, options, pageCount, all_open_issues, function(all_open_issues){
                    this.all_open_issues = all_open_issues;
                    if(this.all_open_issues.length === 0){
                        var issueCount = {
                            allOpenIssues: 0,
                            twentyFourHourOld: 0,
                            betweenOneAndSevenDaysOld: 0,
                            olderThanSevenDays: 0
                        }
                        res.render('index',{issueCount:issueCount, repositoryURL: repositoryURL});
                    }else{
                        removePullRequestsAndGetIssueCount(this.all_open_issues,function(open_issues,issueCount){
                            res.render('index',{issueCount:issueCount, repositoryURL: repositoryURL});
                        });
                    }
                })
            } else {
                res.render('index',{message: "SORRY! We could not find the repository!" , repositoryURL: repositoryURL});
            }
        });
    }else{
        res.render('index',{message: "OOPS! That doesn't seem to be a valid GitHub URL!", repositoryURL: repositoryURL });
    }
})

app.get('/',function(req,res){
    res.render('index')
})

app.listen(process.env.PORT || 3000, function(){
    console.log("Server has started!!");
});