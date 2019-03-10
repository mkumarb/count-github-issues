# Count open issues for a GitHub Repo

To get the count of open issues of a repository by providing a github repository URL

This app is built using __*NodeJS*__. To view the app [click here](http://github-open-issue-count.herokuapp.com/)


## Problem Statement:

#### Create a repository on GitHub and write a program in any programming language that will do the following:

#### Input :
 User can provide a link to any public GitHub repository

#### Ouptut :
 UI should display a table with the following information:

* Total number of open issues
* Number of open issues that were opened in the last 24 hours
* Number of open issues that were opened more than 24 hours ago but less than 7 days ago
* Number of open issues that were opened more than 7 days ago



## Solution:
 The solution is implemented with the help of __*GitHub REST API v3*__

### Below are the implementation steps in sequential order of execution:
 1. Get the total number of pages of open issues to traverse through the API. A call to list GitHub's public repositories provides paginated items in sets of 30 by default. In this implementation, it is set to 100 per page which is the maximum.
 A parameter "state" is set as "open" in the request options to ensure we only get open issues.

 2. Once we identify the total number of pages to traverse/request, we request the data from each of these pages and push all open issues into one single array.

 3. This single array, which has all the open issues (JSON objects) can be traversed through easily to identify the required information.
 
 __*NOTE*__: GitHub's REST API v3 considers **every pull request as an issue**, but not every issue is a pull request. 
 Hence, we would have to eliminate all the pull requests, which are also considered as issues by the API. Also, during this process it calculates the number of open issues based on the criteria mentioned in the problem statement.

 4. The function then returns a JSON object with the result that we require which is passed on to the *ejs* template and we view the required result.



### Packages used
* Express.js
* body-parser
* request
* ejs (Templating engine)



### The solution could be improved by performing the below:
* Logging all the tasks and errors which will help in debugging.
* Add a provision to give some details of the open issues
* If required, the code can be structured by moving the logic to a separate file. 
* Improve the validations on the URL field.




### To view the solution implemented follow the below steps:
1. Navigate to the [link (click here)](http://github-open-issue-count.herokuapp.com/)

2. You will see a simple UI with a single URL field. Enter a GitHub repository URL in this field.
__*Example URL*__:*https://github.com/Microsoft/calculator*

3. Paste the URL and click on the button "*Click to Get Count*"

4. You will be able to view the table with the count of open issues based on the criteria in the problem statement.