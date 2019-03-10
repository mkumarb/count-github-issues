/*
############IMPORTING PACKAGES###########
1. express: helps with the routing functionalities
2. request: To request urls to get the data from the corresponding url
3. body-parser: To help us get form data (in this app to get the URL entered by user)
*/
var express     = require('express'),
    request     = require('request'),
    bodyParser  = require("body-parser");

app = express();

// We are setting the template engine as ejs to render html content
app.set('view engine', 'ejs');

//Enabling middlewares to get form data through request body
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//Enabling middleware to serve static content like css & js from /static folder
app.use('/static', express.static('static'))

/*
We are setting the default options to request data from github api.
Github API sends 30 items/JSON objects per page by default. We can
increase this to a maximum of 100. Hence, we have set per_page as 
100 & then we continue traversing pages based on existence.
We have also passed the parameter, "state" as "open" to list only open issues
*/
var options = {
    /*GitHub API URL syntax to get details of all issues of a repository:
      https://api.github.com/repos/:owner/:repo/issues
      We will change the URL based on user input.*/
    url: 'https://api.github.com/repos/mohanb9/count-github-issues/issues',
    headers: {
        'User-Agent': 'Github open issues',
        'Content-type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
    },
    qs: {
        state: 'open', //parameter to get only open issues
        per_page: 100, // parameter to get 100 issues/items per page which is maximum
        page: 1 //initially we start with the first page for any request
    }
};


/*
###############################################################
Below are the supporting functions which will be used when a 
user provides a URL to get the desired information
###############################################################
*/

/*
FUNCTION: getPageCount
^^^^^^^^^^^^^^^^^^^^^^
This function returns the number of pages containing open issues
that are present with each page containing 100 issues.
Ex: If there are 130 open issues, the function returns 2.

Implementation:
^^^^^^^^^^^^^^
If there is more than one page, we get the url for the last page along with 
page number for the last page as a parameter in the url through the response header link.
If there is only a single page, then the response header link will be undefined.
Ex: When there is more than one page, we get the response header link as below:
<https://api.github.com/resource?page=2>; rel="next",
      <https://api.github.com/resource?page=5>; rel="last"
The below code tries to get the value "5" for the last page
*/
function getPageCount(returnValue){
    request.get(options,function(error,response,body){
        if(!error && response.statusCode == 200){
            link_urls = response.headers.link
            //if response header link is undefined, it means there's only 1 page
            if(link_urls === undefined){ 
                returnValue(1);
            }else {
                //else we will have to find the page number of the last page to find the number of pages.
                link_urls.split(',').forEach((api_link) => {
                    if(api_link.indexOf('rel="last"')>=0)
                        returnValue(parseInt(api_link[api_link.indexOf('&page=')+6]));
                })
            }
        } else {
            //if response is an error or status is not success (200), return -1
            returnValue(-1);
        }
    })
}

/*
FUNCTION: getAllOpenIssues
^^^^^^^^^^^^^^^^^^^^^^^^^^
This function returns a single array containing details of all 
the open issues (each issue as a JSON object) that are obtained 
from multiple pages.
The idea is, once we have all the required information in a single 
array, it will be much easier to get the required information.

Implementation:
^^^^^^^^^^^^^^
Once we identify the number of pages using function "getPageCount", 
this function recursively requests for each page and pushes all the
issues (JSON object) to a single array which is returned through a callback.
*/
var getAllOpenIssues = function(i, optionsNew, pageCount, all_open_issues, returnOpenIssueList) {
    optionsNew.qs.page = i;
    request.get(optionsNew,function(error,response,body){
        if(!error && response.statusCode == 200){
            all_open_issues = [...all_open_issues,...JSON.parse(body)];//pushing all open issues to single array
            if(i===pageCount){
                returnOpenIssueList(all_open_issues)
            }else{
                //if there is more than one page, we recursively call the function for each page.
                getAllOpenIssues(i+1, optionsNew, pageCount, all_open_issues, returnOpenIssueList)
            }  
        } else {
            console.log("Request failed with error: ", JSON.parse(body));
        }
    })
}


/*
FUNCTION: removePullRequestsAndGetIssueCount
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
GitHub's REST API v3 considers ****every pull request as an issue****, 
but not every issue is a pull request. For this reason, "Issues" 
endpoints may return both issues and pull requests in the response. 
We can identify pull requests by the pull_request key.

This function ensures that we eliminate all the pull requests from
the array obtained from function "getAllOpenIssues" & also calculate
the count of open issues based on given criteria in the problem statement.
Finally it returns an object with the count of open issues for each criteria
in the problem statement.

Implementation:
^^^^^^^^^^^^^^
Once we get the entire array containing open issues (which include 
pull requests too) using function "getAllOpenIssues", this function 
loops through each issue to eliminate every JSON object that has the 
key "pull_request" (since these are pull requests and not open issues).
While performing this check, we also calculate the count of open issues
based on given criteria in problem statement.
*/
var removePullRequestsAndGetIssueCount = function(all_issues,returnOpenIssuesCount){
    issuesProcessed = 0;
    var open_issues = [];
    var sevenDaysOldIssues = 0, twentyFourHourOldIssues = 0;
    all_issues.forEach(issue => {
        issuesProcessed++;
        //if the object has a key "pull_request", it means that it is not an issue, hence we eliminate it
        if(!issue.hasOwnProperty('pull_request')){
            open_issues.push(issue);
            //date calculations based on criteria in problem statement
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
                // returns an object with the count of open issues and also the array containing only the open issues
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

/*
###############################################################
##############   END OF SUPPORTING FUNCTIONS  #################
###############################################################
*/

/*
#################### BEGIN ROUTES #######################
When the user requests for home page (path: "/"), we render 
the index.ejs file which contains the form field to enter 
github repository URL.
When the user clicks on the button, the form data is sent to 
the server requesting the information through the same route path "/".
*/
app.get('/',function(req,res){
    res.render('index'); //renders home page with input URL field
})

/*
Once the user submits the form, a POST request is sent which is 
handled by this route. We first form the GitHub API URL from 
the URL shared by the user.
The URL is validated and then the above supporting functions 
are called synchronously to serve their functionality. 
This is achieved through callbacks.
####Summarising the flow of code: 
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
1. Get the total number of pages to traverse through the API
2. Get all open issues into one single array
3. From this array, eliminate all the pull requests, which are
   considered as issues by the API and also calculate the number
   of open issues based on the criteria.
4. The function then returns a JSON object with the result that we require.
*/
app.post('/', function(req,res){
    options.qs.page=1;
    var all_open_issues = [];
    repositoryURL = req.body.repoURL;
    //simple validation of url by checking if string "github.com" is part of url.
    var pos = repositoryURL.indexOf("github.com")
    if(pos >= 0){
        //build final url to request data from GitHub REST API v3 & update options
        apiURL = "https://api.github.com/repos"+repositoryURL.substr(pos+10)+"/issues";
        options.url = apiURL;
        //first get page count
        getPageCount(function(pageCount){
            if(pageCount > 0){
                //then push all open issues to one single page
                getAllOpenIssues(1, options, pageCount, all_open_issues, function(all_open_issues){
                    this.all_open_issues = all_open_issues;
                    //if the array returned is empty, it means there are no open issues. 
                    //Hence, all counts will be 0 (zero).
                    if(this.all_open_issues.length === 0){
                        var issueCount = {
                            allOpenIssues: 0,
                            twentyFourHourOld: 0,
                            betweenOneAndSevenDaysOld: 0,
                            olderThanSevenDays: 0
                        }
                        res.render('index',{issueCount:issueCount, repositoryURL: repositoryURL});
                    }else{
                        //if array is not empty, then remove pull requests from the array and 
                        //then calculate the count based on the days that is specified in problem statement
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

// Default route. When the user navigates to any other URL other than "/", we display the error page
app.get("*",function(req, res) {            
    res.render("page_not_found");
});

// When app is run locally, the server listens to port 3000. But HEROKU, 
// requires process.env.PORT to be able to host on their server.
app.listen(process.env.PORT || 3000, function(){
    console.log("Server has started!!");
});