###EightyApp

**description**: A class that people can extend to create their own custom scraper to use on [80legs.com](http://80legs.com/)

**Usage**:

```javascript
var EightyApp = require("eighty-app");
var app = new EightyApp();

app.processDocument = function(html, url, headers, status, $) {
  
  /* First we parse the HTML into a lightweight DOM equipped with jquery-like dom-traversal functions */
  var $html = app.parseHtml(html, $);
  var data = {}; 

  /* dig out any data you want from within the DOM. Add that data to the data object */

  /* Serialize the data object. You'll see this data object in a result file for a crawl using this 80app */ 
  return JSON.stringify(data); 
}
app.parseLinks = function(html, url, headers, status, $) {
  
  /* First we parse the HTML into a lightweight DOM equipped with jquery-like dom-traversal functions */
  var $html = app.parseHtml(html, $);
  var links = []; 

  /* dig out any links that you want to crawl from within the DOM. Add those links to the links array */  

  /* whatever links you add to this array will also be crawled */
  return links;
}

/* don't forget to add this in! Otherwise we won't be able to use your scraper from within our crawling engine */
module.exports = function() {
  return app;
}
```

refer [here](https://80legs.groovehq.com/help_center) for additional support