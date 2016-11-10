var fs = require("fs");
var expect = require("chai").expect;
var cheerio = require("cheerio");
var EightyAppBase = require("../EightyApp.js");

/* ************************** */
/* ***** HELPER METHODS ***** */
/* ************************** */
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

//TO RUN TESTS: node_modules/mocha/bin/mocha test.js

describe("parseXml", function(){
    var sampleXml;
    var eightyApp;
    before(function(){
        sampleXml = fs.readFileSync(__dirname + "/fixtures/sampleXml.xml");
        eightyApp = new EightyAppBase();
    });
    it ("parses an xml string", function(done){
        var $xml = eightyApp.parseXml(sampleXml.toString(), cheerio);
        var test = $xml.find("product[number=1] img80").text().trim();

        expect(test).to.equal("https://a248.e.akamai.net/f/248/9086/10h/origin-d2.scene7.com/is/image/Coach/q6173_blk_a0");
        done();
    });
});

/* UPDATES: 8-13-2015
 * Testing: Added coverage for invalid input and added coverage for proper function behavior
 * 80app: Added code block to check for invalid input
 * IMPORTANT: have function account for array of objects.
 */
describe("eliminateDuplicates", function(){
    var eightyApp = new EightyAppBase();
    //Testing variables
    var array;
    var test;
    it("returns 'null' when called with no arguments", function(done){
        test = eightyApp.eliminateDuplicates();
        expect(test).to.equal(null);
        done();
    });
    it("returns 'null' when called with a false argument", function(done){
        //null
        array = null;
        test = eightyApp.eliminateDuplicates(array);
        expect(test).to.equal(null);

        //undefined
        array = undefined;
        test = eightyApp.eliminateDuplicates(array);
        expect(test).to.equal(null);
        done();
    });
    it("returns an empty array if called with an empty array", function(done){
        array = [];
        test = arraysEqual([], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);
        done();
    });
    it("does not modify arrays with no duplicates", function(done){
        array = [1];
        test = arraysEqual([1], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = ["a"];
        test = arraysEqual(["a"], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = [1,2,3,4,5,6,7,8,9];
        test = arraysEqual([1,2,3,4,5,6,7,8,9], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = ["a","b","c","d","e","f","g"];
        test = arraysEqual(["a","b","c","d","e","f","g"], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);
        done();
    });
    it("eliminates empty elements", function(done){
        array = ["abc", "ab", ""];
        test = arraysEqual(["abc", "ab"], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true)
        done();
    });
    it("eliminates duplicates", function(done){
        array = [1,1];
        test = arraysEqual([1], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = [1,1,2,2,3,3,4,4,5,5,6,6];
        test = arraysEqual([1,2,3,4,5,6], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = [1,2,2,3,3,3,4,4,4,4,5,5,5,5,5,6,6,6,6,6,6];
        test = arraysEqual([1,2,3,4,5,6], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = [1,2,3,4,5,6,1];
        test = arraysEqual([1,2,3,4,5,6], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = [1,2,3,4,5,6,6,5,4,3,2,1];
        test = arraysEqual([1,2,3,4,5,6], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = ["a","a"];
        test = arraysEqual(["a"], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = ["a","a","b","b","c","c"];
        test = arraysEqual(["a","b","c"], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = ["a","b","a","c","b","c"];
        test = arraysEqual(["a","b","c"], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);
        done();
    });
});//describe: "eliminateDuplicates"

/* UPDATES: 8-11-2015
 * Expanded testing for false input
 * Modified 80app to handle all false input, not just 'undefined'
 */
describe("makeLink", function(){
    eightyApp = new EightyAppBase();
    it("appends the path to the domain", function(done){
        var domain = "www.80legs.com";
        var link = "/index.html";
        var test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/index.html");

        domain = "http://www.80legs.com/";
        link = "/plans.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/plans.html");

        domain = "http://www.80legs.com";
        link = "plans.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/plans.html");

        domain = "http://www.80legs.com/";
        link = "plans.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/plans.html");

        domain = "http://www.80legs.com";
        link = "/plans.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/plans.html");

        domain = "80legs.com";
        link = "/plans.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://80legs.com/plans.html");

        domain = "http://80legs.com";
        link = "80legs.com/plans.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://80legs.com/plans.html");

        domain = "http://80legs.com";
        link = "http://www.80legs.com/plans.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/plans.html");

        domain = "www.80legs.com";
        link = "80legs.com/plans.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://80legs.com/plans.html");

        domain = "www.80legs.com";
        link = "/";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/");

        domain = "www.80legs.com/en/contact/";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/prices.html");

        domain = "www.80legs.co.uk/en/contact/";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.co.uk/prices.html");

        domain = "www.80legs.com?q=dog:bark";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/prices.html");

        domain = "www.80legs.co.uk?q=dog:bark";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.co.uk/prices.html");

        domain = "http://80legs.co.uk?q=dog:bark";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://80legs.co.uk/prices.html");

        domain = "http://www.80legs.co.uk?q=dog:bark";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.co.uk/prices.html");

        domain = "https://80legs.com/en/contact/";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("https://80legs.com/prices.html");

        domain = "https://80legs.com/en/contact/index.html";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("https://80legs.com/prices.html");

        domain = "https://80legs.com/index.html";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("https://80legs.com/prices.html");

        domain = "https://www.80legs.com/en/contact/";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("https://www.80legs.com/prices.html");

        domain = "www.beef-is-smelly.co.uk?q=dog:bark";
        link = "/prices.html";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.beef-is-smelly.co.uk/prices.html");

        domain = "www.80legs.com/";
        link = "/";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/");

        domain = "www.80legs.com";
        link = "#";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/#");

        domain = "www.80legs.com/";
        link = "#";
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal("http://www.80legs.com/#");

        done();
    });//it: ("appends the path to the domain")

    it("returns 'null' when called with no arguments", function(done){
        var test = eightyApp.makeLink();
        expect(test).to.equal(null);
        done();
    });

    it("returns the input argument when called with only one argument", function(done){
        var domain = "www.80legs.com";
        var test = eightyApp.makeLink(domain);
        expect(test).to.equal("www.80legs.com");
        done();
    });

    it("returns the domain when called with a false href", function(done){
        var domain = "www.80legs.com";
        var href = undefined;
        var test = eightyApp.makeLink(domain, href);
        expect(test).to.equal("www.80legs.com");
        done();
    });

    it("returns the href when called with a false domain", function(done){
        var domain = undefined;
        var href = "/prices.html";
        var test = eightyApp.makeLink(domain, href);
        expect(test).to.equal("/prices.html");
        done();
    });
});

/* UPDATES: 8-11-2015
 * Testing: Expanded coverage for invalid input handling, added coverage for proper function behavior
 * 80app: Fixed adding flags to links with a '&' at the end
 */
describe("append80FlagToLink ", function(){
    var eightyApp = new EightyAppBase();
    it("returns 'null' when called with no arguments", function(done){
        var test = eightyApp.append80FlagToLink();
        expect(test).to.equal(null);
        done();
    });
    it("returns eighty value when called with false link", function(done){
        var eightyValue = "defined";

        //null
        var link = null;
        var test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("defined");

        //undefined
        link = undefined;
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("defined");

        //empty string
        link = "";
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("defined");
        done();
    });
    it("returns link when called with false eighty value", function(done){
        var link = "http://www.test.com/";

        //null
        var eightyValue = null;
        var test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("http://www.test.com/");

        //undefined
        eightyValue = undefined;
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("http://www.test.com/");

        //empty string
        eightyValue = "";
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("http://www.test.com/");
        done();
    });
    it("appends 80flag to links without any flags", function(done){
        var link = "http://www.test.com";
        var eightyValue = "test";
        var test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("http://www.test.com?80flag=test");

        link = "http://www.test.com/";
        eightyValue = "test";
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("http://www.test.com/?80flag=test");

        link = "http://www.test.com?";
        eightyValue = "test";
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("http://www.test.com?80flag=test");
        done();
    });
    it("appends 80flag to links with existing flags", function(done){
        var link = "http://www.test.com?flag=donotmodify";
        var eightyValue = "test";
        var test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("http://www.test.com?flag=donotmodify&80flag=test");

        link = "http://www.test.com?flag=donotmodify&";
        eightyValue = "test";
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("http://www.test.com?flag=donotmodify&80flag=test");

        link = "http://www.test.com?flag1=do&flag2=not&flag3=modify";
        eightyValue = "test";
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal("http://www.test.com?flag1=do&flag2=not&flag3=modify&80flag=test");
        done();
    });
});//describe: "append80FlagToLink"

describe("get80Value", function(){
    var eightyApp = new EightyAppBase();
    it("returns null if null is passed in as an argument", function(done){
        var url = null;
        var test = eightyApp.get80Value(url);
        expect(test).to.equal(null);
        done();
    });
    it("returns null if undefined is passed in as an argument", function(done){
        var url = undefined;
        var test = eightyApp.get80Value(url);
        expect(test).to.equal(null);
        done();
    });
    it("returns null if a url is passed in that has no 80flag", function(done){
        var url = "http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?id=pcmcat333800050003";
        var test = eightyApp.get80Value(url);
        expect(test).to.equal(null);
        done();
    });
    it("returns an empty string if the 80flag= query parameter has no value", function(done){
        var url = "http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?id=pcmcat333800050003&80flag=";
        var test = eightyApp.get80Value(url);
        expect(test).to.equal('');
        done();
    });
    it("returns null if the word 80flag is in the string with no value", function(done){
        var url = "http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?id=pcmcat333800050003&80flag";
        var test = eightyApp.get80Value(url);
        expect(test).to.equal(null);
        done();
    });
    it("returns the eighty value if there is one", function(done){
        var url = "http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?id=pcmcat333800050003&80flag=test1";
        var test = eightyApp.get80Value(url);
        expect(test).to.equal("test1");

        var url = "http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?80flag=test2";
        var test = eightyApp.get80Value(url);
        expect(test).to.equal("test2");
        done();
    });
    it("returns only the eighty value if followed by another parameter", function(done){
        var url = "http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?80flag=test1&parameter=bad";
        var test = eightyApp.get80Value(url);
        expect(test).to.equal("test1");

        var url = "http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?parameter1=bad&80flag=test2&parameter2=alsoBad";
        var test = eightyApp.get80Value(url);
        expect(test).to.equal("test2");
        done();
    });
});//describe: "get80Value"

//IMPORTANT: Fix punctuation regex!
describe("getPlainText", function(){
    var eightyApp = new EightyAppBase();

    //TEST CASES FROM removeExtraWhitespace - behavior should be the same
    it("returns empty string for false input", function(done){
        var string = undefined;
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("");

        string = null;
        test = eightyApp.getPlainText(string);
        expect(test).to.equal("");

        string = "";
        test = eightyApp.getPlainText(string);
        expect(test).to.equal("");
        done();
    });
    it("removes beginning and end whitespaces", function(done){
        //Trailing space
        var string = "test ";
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("test");

        //Beginning space
        string = " test";
        test = eightyApp.getPlainText(string);
        expect(test).to.equal("test");

        //Spaces on both ends
        string = " test ";
        test = eightyApp.getPlainText(string);
        expect(test).to.equal("test");

        //Double spaces on both ends
        string = "  test  ";
        test = eightyApp.getPlainText(string);
        expect(test).to.equal("test");
        done();

        //Other whitespace on both ends
        string = "\ttest\r";
        test = eightyApp.getPlainText(string);
        expect(test).to.equal("test");

        string = "\ntest\v";
        test = eightyApp.getPlainText(string);
        expect(test).to.equal("test");

        string = "\ftest ";
        test = eightyApp.getPlainText(string);
        expect(test).to.equal("test");

        //Removes double whitespace on both ends
        string = "\t\rtest\n\v";
        test = eightyApp.getPlainText(string);
        expect(test).to.equal("test");

        string = "\v\ftest\r\t";
        test = eightyApp.getPlainText(string);
        expect(test).to.equal("test");
    });
    it("removes multiple whitespace", function(done){
        var string = "a  b  c  d  e";
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("a b c d e");

        var string = "a  b\t\tc\r\rd\n\ne\v\vf\f\fg";
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("a b c d e f g");

        var string = "a \tb\t\rc\r\nd\n\ve\v\ff\f g";
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("a b c d e f g");
        done();
    });
    it("changes all whitespace characters to space", function(done){
        var string = "a b\tc\rd\ne\vf\fg";
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("a b c d e f g");
        done();
    });

    //TEST CASES EXCLUSIVE TO: getPlainText
    it("preserves A-Z characters, ignoring case", function(done){
        var string = "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        done();
    });
    it("preserves 0-9 characters", function(done){
        var string = "0 1 2 3 4 5 6 7 8 9";
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("0 1 2 3 4 5 6 7 8 9");
        done();
    });
    it("preserves certain [.'-:!] punctuation", function(done){ //NOTE: Weird behavior here regarding '-: -> ask Moe about it
        var string = "a.b'c-d:e!f";
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("a.b'c-d:e!f");
        done();
    });
    it("removes special characters", function(done){
        var string = "ÄäÇçĞğİıÖöŞşÜüßàáâãèéêëěìíîïñòóôõřùúûýÿÀÁÂÃÈÉÊËÌÍÎÏÑÒÓÔÕÙÚÛÝ";
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("");
        done();
    });
    it("removes non-allowed punctuation", function(done){ //NOTE: Expand here after discussion with Moe
        var string = "a;b";
        var test = eightyApp.getPlainText(string);
        expect(test).to.equal("ab");
        done();
    });
});//describe: "getPlainText"


/* UPDATES: 8/10/2015
 * Added block to catch invalid input
 * Added 'else' to return just the text if a non-recognized currency is input
 */
describe("getPriceRangeReplace", function(){
    var eightyApp = new EightyAppBase();
    it("returns empty string when called with no arguments", function(done){
        var test = eightyApp.getPriceRangeReplace();
        expect(test).to.equal("");
        done();
    });
    it("returns empty string when called with false text", function(done){
        //null
        var arg0 = null;
        var test = eightyApp.getPriceRangeReplace(arg0, "USD");
        expect(test).to.equal("");

        //undefined
        arg0 = undefined;
        test = eightyApp.getPriceRangeReplace(arg0, "USD");
        expect(test).to.equal("");

        //empty string
        arg0 = "";
        test = eightyApp.getPriceRangeReplace(arg0, "USD");
        expect(test).to.equal("");
        done();
    });
    it("returns empty string when called with false currency", function(done){
        var validText = "defined";
        //null
        var arg1 = null;
        var test = eightyApp.getPriceRangeReplace(validText, arg1);
        expect(test).to.equal("");

        //undefined
        arg1 = undefined;
        test = eightyApp.getPriceRangeReplace(validText, arg1);
        expect(test).to.equal("");

        //empty string
        arg1 = "";
        test = eightyApp.getPriceRangeReplace(validText, arg1);
        expect(test).to.equal("");
        done();
    });
    it("returns empty string when called with false text and false currency", function(done){
        //null
        var arg0 = null;
        var arg1 = null;
        var test = eightyApp.getPriceRangeReplace(arg0, arg1);
        expect(test).to.equal("");

        //undefined
        arg0 = undefined;
        arg1 = undefined;
        test = eightyApp.getPriceRangeReplace(arg0, arg1);
        expect(test).to.equal("");

        //empty string
        arg0 = "";
        arg1 = "";
        test = eightyApp.getPriceRangeReplace(arg0, arg1);
        expect(test).to.equal("");
        done();
    });
    it("does not modify strings with no currency indicators (e.g. \"$\" or \"£\")", function(done){
        var arg = "do not modify USD 56.00";
        var test = eightyApp.getPriceRangeReplace(arg, "USD");
        expect(test).to.equal("do not modify USD 56.00");

        arg = "do not modify GBP 74,00";
        test = eightyApp.getPriceRangeReplace(arg, "GBP");
        expect(test).to.equal("do not modify GBP 74,00");
        done();
    });
    it("returns original string if currency is not recognized", function(done){
        var arg = "GBP 15.00 £ ££ £££ ££££ original $ $$ $$$ $$$$ USD 15.00";
        var test = eightyApp.getPriceRangeReplace(arg, "ZZZ");
        expect(test).to.equal("GBP 15.00 £ ££ £££ ££££ original $ $$ $$$ $$$$ USD 15.00");
        done();
    });
    it("replaces USD currency ranges correctly", function(done){
        var arg = "USD: $ $$ $$$ $$$$";
        var test = eightyApp.getPriceRangeReplace(arg, "USD");
        expect(test).to.equal("USD: USD 0.00-25.00 USD 25.00-40.00 USD 50.00-55.00 Above USD 55.00");
        done();
    });
    it("replaces GBP currency ranges correctly", function(done){
        var arg = "GBP: £ ££ £££ ££££";
        var test = eightyApp.getPriceRangeReplace(arg, "GBP");
        expect(test).to.equal("GBP: GBP 0.00-15.00 GBP 15.00-25.00 GBP 30.00-35.00 Above GBP 35.00");
        done();
    });
});//describe: "getPriceRangeReplace"

/* UPDATES: 8-11-2015
 * Testing: Added coverage for proper function behavior, expanded coverage for invalid input
 * 80app: Changed method to select characters to more be more efficient (secondLastChar and thirdLastChar)
 */
describe("normalizePrice ", function(){
    var eightyApp = new EightyAppBase();
    it("returns 'null' when called with no arguments", function(done){
        var test = eightyApp.normalizePrice();
        expect(test).to.equal(null);
        done();
    });
    it("returns 'null' when called with invalid arguments", function(done){
        //null
        var arg = null;
        var test = eightyApp.normalizePrice(arg);
        expect(test).to.equal(null);

        //undefined
        arg = undefined;
        test = eightyApp.normalizePrice(arg);
        expect(test).to.equal(null);

        //empty string
        arg = "";
        test = eightyApp.normalizePrice(arg);
        expect(test).to.equal(null);
        done();
    });
    it("normalizes prices with no decimal digits correctly", function(done){
        var string = "1";
        var test = eightyApp.normalizePrice(string);
        expect(test).to.equal("1.00");

        string = "1234";
        test = eightyApp.normalizePrice(string);
        expect(test).to.equal("1234.00");

        string = "123,456,789";
        test = eightyApp.normalizePrice(string);
        expect(test).to.equal("123456789.00");
        done();
    });
    it("normalizes prices with one digit after decimal place correctly", function(done){
        var string = "123.4";
        var test = eightyApp.normalizePrice(string);
        expect(test).to.equal("123.40");

        string = "123,4";
        test = eightyApp.normalizePrice(string);
        expect(test).to.equal("123.40");
        done();
    });
    it("normalizes prices with two digits after decimal place correctly", function(done){
        var string = "123.45";
        var test = eightyApp.normalizePrice(string);
        expect(test).to.equal("123.45");

        string = "123,45";
        test = eightyApp.normalizePrice(string);
        expect(test).to.equal("123.45");
        done();
    });
    it("normalizes prices with more than two digits after decimal place correctly", function(done){
        var string = "5.777777777777778";
        var test = eightyApp.normalizePrice(string)
        expect(test).to.equal("5.78");
        done();
    });
});//describe: "normalizePrice"

describe("removeExtraWhitespace", function(){
    var eightyApp = new EightyAppBase();
    it("returns empty string for false input", function(done){
        var string = undefined;
        var test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("");

        string = null;
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("");

        string = "";
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("");
        done();
    });
    it("removes beginning and end whitespaces", function(done){
        //Trailing space
        var string = "test ";
        var test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("test");

        //Beginning space
        string = " test";
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("test");

        //Spaces on both ends
        string = " test ";
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("test");

        //Double spaces on both ends
        string = "  test  ";
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("test");
        done();

        //Other whitespace on both ends
        string = "\ttest\r";
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("test");

        string = "\ntest\v";
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("test");

        string = "\ftest ";
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("test");

        //Removes double whitespace on both ends
        string = "\t\rtest\n\v";
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("test");

        string = "\v\ftest\r\t";
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("test");
    });
    it("removes multiple whitespace", function(done){
        var string = "a  b  c  d  e";
        var test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("a b c d e");

        var string = "a  b\t\tc\r\rd\n\ne\v\vf\f\fg";
        var test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("a b c d e f g");

        var string = "a \tb\t\rc\r\nd\n\ve\v\ff\f g";
        var test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("a b c d e f g");
        done();
    });
    it("changes all whitespace characters to space", function(done){
        var string = "a b\tc\rd\ne\vf\fg";
        var test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal("a b c d e f g");
        done();
    });
});//describe: "removeExtraWhitespace"

/* UPDATES: 8-13-2015
 * Testing: Added coverage for invalid input and added coverage for proper function behavior
 * 80app: Added code block to check for invalid input
 */
describe("removeTag", function(){
    var eightyApp = new EightyAppBase();
    //Testing variables
    var string;
    var test;
    it("returns empty string when called with false/no arguments", function(done){
        test = eightyApp.removeTag();
        expect(test).to.equal("");

        //null
        string = null;
        test = eightyApp.removeTag(string);
        expect(test).to.equal("");

        //undefined
        string = undefined;
        test = eightyApp.removeTag(string);
        expect(test).to.equal("");

        //empty string
        string = "";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("");
        done();
    });
    it("does not modify text with no tags", function(done){
        string = "abcdefghijklmnopqrstuvwxyz";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("abcdefghijklmnopqrstuvwxyz");

        string = "the quick brown fox jumped over the lazy dog";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("the quick brown fox jumped over the lazy dog");

        string = "x = 0. If x<1 do not modify";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("x = 0. If x<1 do not modify");

        string = "x = 2. If x>1 do not modify";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("x = 2. If x>1 do not modify");
        done();
    });
    it("removes tags", function(done){
        string = "<div></div>";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("");

        string = "<img80 src=\"http://imgur.com/gallery/7eGFo3I\">";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("");

        string = "<h1>test</h1>";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("test");

        string = "<h1><strong>bol</strong>d</h1>";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("bold");

        string = "<div id='first-product' class=\"highlight box\"><a href=\"petfooddirect.com/dog\"><h1><strong>dog</strong> food</h1></a></div>";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("dog food");

        string = "<abcdefhijklmnopqrstuvwxyz>testing<zyxwvutsrqponmlkjihfedcba>";
        test = eightyApp.removeTag(string);
        expect(test).to.equal("testing");
        done();
    });
});//describe: "removeTag"

describe("replaceSpecialCharacters ", function(){
    var eightyApp = new EightyAppBase();
    it("replaces special characters with alphanumeric equivalents", function(done){
        var string = "ÄäÇçĞğİıÖöŞşÜüßàáâãèéêëěìíîïñòóôõřùúûýÿÀÁÂÃÈÉÊËÌÍÎÏÑÒÓÔÕÙÚÛÝ";
        var test = eightyApp.replaceSpecialCharacters(string);
        expect(test).to.equal("AaCcGgIiOoSsUussaaaaeeeeeiiiinooooruuuyyAAAAEEEEIIIINOOOOUUUY");
        done();
    });
    it("returns original string if it contains no special characters", function(done){
        var string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var test = eightyApp.replaceSpecialCharacters(string);
        expect(test).to.equal("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
        done();
    });
    it("preserves non-special characters when special characters are present", function(done){
        var string = "AÄäa CÇçc GĞğg Iİıi OÖöo SŞşs UÜüu ssßss aàaáaâaãa eèeéeêeëeěe iìiíiîiïi" + 
                     " nñn oòoóoôoõ rřr uùuúuûu yýyÿy AÀAÁAÂAÃA EÈEÉEÊEËE aÌbÍcÎdÏe qÑv -Ò;Ó:Ô'Õ\" $Ù@Ú!Û% YÝY";
        var test = eightyApp.replaceSpecialCharacters(string);

        var expectedResult = "AAaa CCcc GGgg IIii OOoo SSss UUuu ssssss aaaaaaaaa eeeeeeeeeee iiiiiiiii" + 
                             " nnn oooooooo rrr uuuuuuu yyyyy AAAAAAAAA EEEEEEEEE aIbIcIdIe qNv -O;O:O'O\" $U@U!U% YYY";
        expect(test).to.equal(expectedResult);
        done();
    });
    it("preserves spacing", function(done){
        var string = "a  Ä\t\tc\n\nÇ\r\r\r\ri\r\vİ\fo \t\n\r\v\fÖ";
        var test = eightyApp.replaceSpecialCharacters(string);
        expect(test).to.equal("a  A\t\tc\n\nC\r\r\r\ri\r\vI\fo \t\n\r\v\fO");
        done();
    });
});//describe: "replaceSpecialCharacters"

describe('trimAll', function() {
	var eightyApp = new EightyAppBase();
	it("does not modify strings which should not be modified", function(done) {
		var array_normal = ["por ti", "mi", "orgullo", "ahogo", "en una botella"];
		var array = ["por ti", "mi", "orgullo", "ahogo", "en una botella"];
        var test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
		done();
	});
	it("handles one item with whitespae at start", function(done) {
		var array_normal = ["por ti", "mi", "orgullo", "ahogo", "en una botella"];
		var array = [" por ti", "mi", "orgullo", "ahogo", "en una botella"];
        var test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
		done();
	});
	it("handles two items with whitespae at start", function(done) {
		var array_normal = ["por ti", "mi", "orgullo", "ahogo", "en una botella"];
		var array = [" por ti", "mi", " orgullo", "ahogo", "en una botella"];
        var test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
		done();
	});
	it("handles one item with whitespae at end", function(done) {
		var array_normal = ["por ti", "mi", "orgullo", "ahogo", "en una botella"];
		var array = ["por ti ", "mi", "orgullo", "ahogo", "en una botella"];
        var test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
		done();
	});
	it("handles two items with whitespae at end", function(done) {
		var array_normal = ["por ti", "mi", "orgullo", "ahogo", "en una botella"];
		var array = ["por ti ", "mi", "orgullo", "ahogo", "en una botella "];
        var test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
		done();
	});
	it("handles one item with whitespace at end and another with it at start", function(done) {
		var array_normal = ["por ti", "mi", "orgullo", "ahogo", "en una botella"];
		var array = ["por ti ", "mi", " orgullo", "ahogo", "en una botella"];
        var test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);

		array = ["por ti ", " mi", " orgullo", "ahogo ", "en una botella"];
		test = eightyApp.trimAll(array);
        test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
		done();
	});
	it ('handles empty array', function(done) {
		var array = [];
		var test = eightyApp.trimAll(array);
		expect(test).to.equal(null);
		done();
	});
	it ('handles array with an integer', function(done) {
		var array = ["test", 1];
		var test = eightyApp.trimAll(array);
		expect(test).to.equal(null);
		done();
	});
	it ('handles array with an float', function(done) {
		var array = ["test", 1.5];
		var test = eightyApp.trimAll(array);
		expect(test).to.equal(null);
		done();
	});
	it ('handles array with a boolean', function(done) {
		var array = ["test", false];
		var test = eightyApp.trimAll(array);
		expect(test).to.equal(null);
		done();
	});
	it ('handles array with a null', function(done) {
		var array = ["test", null];
		var test = eightyApp.trimAll(array);
		expect(test).to.equal(null);
		done();
	});
	it ('handles array with a undefined', function(done) {
		var array = ["test", undefined];
		var test = eightyApp.trimAll(array);
		expect(test).to.equal(null);
		done();
	});
	it ('handles nested array', function(done) {
		var array = ["test", ["dog"]];
		var test = eightyApp.trimAll(array);
		expect(test).to.equal(null);
		done();
	});
	it ('handles array with object', function(done) {
		var array = ["test", {"dog": "rat"}];
		var test = eightyApp.trimAll(array);
		expect(test).to.equal(null);
		done();
	});
	it ('handles plain stirng', function(done) {
		var array = "Me interesas";
		var test = eightyApp.trimAll(array);
		expect(test).to.equal(null);
		done();
	});
	it ('handles no parameters', function(done) {
		var test = eightyApp.trimAll();
		expect(test).to.equal(null);
		done();
	});
	it ('handles undefined', function(done) {
		var test = eightyApp.trimAll(undefined);
		expect(test).to.equal(null);
		done();
	});
	it ('handles an array with mixed types', function(done) {
		var test = eightyApp.trimAll([undefined, null, 1, "hello", "   migas", "tit  "]);
		expect(test).to.equal(null);
		done();
	});
	it ('handles null', function(done) {
		var test = eightyApp.trimAll(null);
		expect(test).to.equal(null);
		done();
	});
});
describe("stateCodeConverter", function() { 
	eightyApp = new EightyAppBase();
	it("handles a true value", function(done) {
		var test = eightyApp.stateCodeConverter["Texas"];
		expect(test).to.equal("TX");
		done();
	});
	it("handles a false value", function(done) {
		var test = eightyApp.stateCodeConverter["tegucigalpa"];
		expect(test).to.equal(undefined);
		done();
	});
});

describe("countryCodeConverter", function() { 
	eightyApp = new EightyAppBase();
	it("handles a true value", function(done) {
		var test = eightyApp.countryCodeConverter["Greenland"];
		expect(test).to.equal("GL");
		done();
	});
	it("handles a false value", function(done) {
		var test = eightyApp.stateCodeConverter["tegucigalpa"];
		expect(test).to.equal(undefined);
		done();
	});
});
describe("encodeSpanish", function() { 
	eightyApp = new EightyAppBase();
	it("encodes spanish properly", function(done) {
	    var spanishString = "á, é, í, ó,ú,ñ,ü, Á, É, Í, Ó, Ú, Ñ, Ü";
	    var encodedSpanishString = "%C3%A1, %C3%A9, %C3%AD, %C3%B3,%C3%BA,%C3%B1,%C3%BC, %C3%81, %C3%89, %C3%8D, %C3%93, %C3%9A, %C3%91, %C3%9C";
		var test = eightyApp.encodeSpanish(spanishString);
		expect(test).to.equal(encodedSpanishString);
		done();
	});
});

/* UPDATES: 07-14-2016
 * Testing: Added function to check if a paymentType is valid
 * 80app: Added code block to check for invalid input
 */
describe("processPaymentTypes", function(){
    eightyApp = new EightyAppBase();
    it('valid payment type', function(done){
        var needle = 'Master Card';
        var test = eightyApp.processPaymentTypes(needle);
        expect(test).to.equal(true);
        done();
    })
    it('invalid payment type', function(done){
        var needle = 'Other'
        var test = eightyApp.processPaymentTypes(needle);
        expect(test).to.equal(false);
        done();
    })
})

/* UPDATES: 07-14-2016
 * Testing: Added function to check if a day/day-range is valid
 * 80app: Added code block to check input and make it valid
 */
describe("processDay", function(){
    eightyApp = new EightyAppBase();
    it('is valid day', function(done){
        var needle = 'Mon';
        var test = eightyApp.processDay(needle)
        expect(test).to.equal('Monday');
        done();
    })
    it('is invalid day', function(done){
        var needle = 'Other'
        var test = eightyApp.processDay(needle);
        expect(test).to.equal(needle);
        done();
    })
    it('is valid day range', function(done){
        var needle = 'Mon - Thu'
        var test = eightyApp.processDay(needle)
        expect(test).to.equal('Monday - Thursday')
        done();
    })
})


/* UPDATES: 07-14-2016
 * Testing: Added function to check if a day/day-range is valid
 * 80app: Added code block to check input and make it valid
 */
describe("processHour", function(){
    eightyApp = new EightyAppBase();
    it('is valid hour', function(done){
        var needle = '8:00 am - 9:00 pm'
        var test = eightyApp.processHour(needle)
        expect(test).to.equal(needle)
        done()
    })
    it('am/pm with no space', function(done){
        var needle = '8:00am - 9:00pm'
        var test = eightyApp.processHour(needle)
        expect(test).to.equal('8:00 am - 9:00 pm')
        done()
    })
    it('am/pm with no space/ no minutes', function(done){
        var needle = '8am - 9pm'
        var test = eightyApp.processHour(needle)
        expect(test).to.equal('8:00 am - 9:00 pm')
        done()
    })
    it('hour with leading 0', function(done){
        var needle = '08:00am - 09:00pm'
        var test = eightyApp.processHour(needle)
        expect(test).to.equal('08:00 am - 09:00 pm')
        done()
    })
    it('hour without minutes', function(done){
        var needle = '8 am - 9 pm'
        var test = eightyApp.processHour(needle)
        expect(test).to.equal('8:00 am - 9:00 pm')
        done()
    })
    it('24 hours', function(done){
        var needle = '24 hours'
        var test = eightyApp.processHour(needle)
        expect(test).to.equal('12:00 am - 11:59 pm')
        done()
    })
    it('Invalid hours/range', function(done){
        var needle = '44:00 am - 19:00'
        var test = eightyApp.processHour(needle)
        expect(test).to.equal('manual check required')
        done()
    })
})

/* UPDATES: 10-25-2016
 * Testing: Added function to remove 80flag from URL
 * 80app: Added code block to check input and make it valid
 */
describe("strip80flagFromURL", function(){
    eightyApp = new EightyAppBase();
    it('No 80flag', function(done){
        var needle = 'http://www.80legs.com';
        var test = eightyApp.strip80flagFromURL(needle)
        expect(test).to.equal('http://www.80legs.com');
        done();
    })
    it('Basic 80flag', function(done){
        var needle = 'http://www.80legs.com?80flag=test';
        var test = eightyApp.strip80flagFromURL(needle)
        expect(test).to.equal('http://www.80legs.com');
        done();
    })
    it('Basic 80flag with slash', function(done){
        var needle = 'http://www.80legs.com/?80flag=test';
        var test = eightyApp.strip80flagFromURL(needle)
        expect(test).to.equal('http://www.80legs.com/');
        done();
    })
    it('Other parameter before 80flag', function(done){
        var needle = 'http://www.80legs.com?param=blah&80flag=test';
        var test = eightyApp.strip80flagFromURL(needle)
        expect(test).to.equal('http://www.80legs.com?param=blah');
        done();
    })
    it('Other parameter after 80flag', function(done){
        var needle = 'http://www.80legs.com?80flag=test&param=blah';
        var test = eightyApp.strip80flagFromURL(needle)
        expect(test).to.equal('http://www.80legs.com?param=blah');
        done();
    })
    it('80flag has JSON string', function(done){
        var needle = "http://www.80legs.com?80flag={'test':'hello','blah':'yay'}";
        var test = eightyApp.strip80flagFromURL(needle)
        expect(test).to.equal('http://www.80legs.com');
        done();
    })
})

/* UPDATES: 10-25-2016
 * Testing: Added function to map legacy DF data types to new ones
 * 80app: Added code block to check input and make it valid
 */
describe("finalizeDataType", function(){
    eightyApp = new EightyAppBase();
    it('product', function(done){
        var needle = 'product';
        var test = eightyApp.finalizeDataType(needle)
        expect(test).to.equal('product');
        done();
    })
    it('products', function(done){
        var needle = 'products';
        var test = eightyApp.finalizeDataType(needle)
        expect(test).to.equal('product');
        done();
    })
    it('location', function(done){
        var needle = 'location';
        var test = eightyApp.finalizeDataType(needle)
        expect(test).to.equal('business');
        done();
    })
    it('business', function(done){
        var needle = 'business';
        var test = eightyApp.finalizeDataType(needle)
        expect(test).to.equal('business');
        done();
    })
    it('Invalid data type', function(done){
        var needle = 'blah';
        var test = eightyApp.finalizeDataType(needle)
        expect(test).to.equal(null);
        done();
    })
})

/* UPDATES: 10-25-2016
 * Testing: Added function to convert legacy Datafiniti string values into objects with source URL attributes
 * 80app: Added code block to check input and make it valid
 */
describe("convertStringToObjectWithSourceURL", function(){
    eightyApp = new EightyAppBase();
    it('Description String', function(done){
        var needleKey = 'description';
	var needleValue = 'This is a description.';
	var needleURL = 'http://www.80legs.com';
        var test = eightyApp.convertStringToObjectWithSourceURL(needleKey, needleValue, needleURL)
	var expectedObject = {description:'This is a description.',sourceURL:'http://www.80legs.com'}

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    })
})

/* UPDATES: 10-25-2016
 * Testing: Added function to add a sourceURL to an object
 * 80app: Added code block to check input and make it valid
 */
describe("addSourceURLToObject", function(){
    eightyApp = new EightyAppBase();
    it('SKU Object', function(done){
        var needleObject = {sku:'12345'};
        var needleURL = 'http://www.80legs.com';
        var test = eightyApp.addSourceURLToObject(needleObject, needleURL)
        var expectedObject = {sku:'12345',sourceURL:'http://www.80legs.com'}

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    })
})

/* UPDATES: 10-25-2016
 * Testing: Added function to convert string values to list of objects with source URLs
 * 80app: Added code block to check input and make it valid
 */
describe("finalizeFieldAsListOfObjects", function(){
    eightyApp = new EightyAppBase();
    it('String', function(done){
        var needleOldFieldName = 'description';
        var needleOldFieldValue = 'This is a description.';
        var needleURL = 'http://www.80legs.com';
        var test = eightyApp.finalizeFieldAsListOfObjects(needleOldFieldName, needleOldFieldValue, needleURL)
        var expectedObject = [{description:'This is a description.',sourceURL:'http://www.80legs.com'}]

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    })
    it('Array of objects', function(done){
        var needleOldFieldName = 'description';
        var needleOldFieldValue = [{description:'This is a description.'},{description:'This is a second description.'}]
        var needleURL = 'http://www.80legs.com';
        var test = eightyApp.finalizeFieldAsListOfObjects(needleOldFieldName, needleOldFieldValue, needleURL)
        var expectedObject = [{description:'This is a description.',sourceURL:'http://www.80legs.com'},{description:'This is a second description.',sourceURL:'http://www.80legs.com'}]

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    })
    it('Single Object', function(done){
        var needleOldFieldName = 'description';
        var needleOldFieldValue = {description: 'This is a description.'}
        var needleURL = 'http://www.80legs.com';
        var test = eightyApp.finalizeFieldAsListOfObjects(needleOldFieldName, needleOldFieldValue, needleURL)
        var expectedObject = [{description:'This is a description.',sourceURL:'http://www.80legs.com'}]

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    })
})

/* UPDATES: 10-25-2016
 * Testing: Added function to finalize a record so it can be imported into Datafiniti.  Handles a lot of legacy mapping.
 * 80app: Added code block to check input and make it valid
 */
describe("finalizeRecord", function(){
    eightyApp = new EightyAppBase();
    it('array of records', function(done){
      var needleResult = [
	{
		"dataType": "product",
		"brand": "Bradford White",
		"name": "Ef Series Ultra High Efficiency Models",
		"manufacturerNumber": "EF-60T-125E-3N"
	},
	{
		"dataType": "product",
		"brand": "Bradford White",
		"name": "Ef Series Ultra High Efficiency Models",
		"manufacturerNumber": "EF-60T-150E-3N"
	},
	{
		"dataType": "product",
		"brand": "Bradford White",
		"name": "Ef Series Ultra High Efficiency Models",
		"manufacturerNumber": "EF-60T-199E-3N"
	}
]

        var needleURL = 'http://www.bradfordwhite.com/sites/default/files/manuals-spec-sheets/commercial/gas-natural/';
        var test = eightyApp.finalizeRecord(needleResult, needleURL);

        var expectedObject = [
        {
                "dataType": "product",
                "brand": "Bradford White",
                "name": "Ef Series Ultra High Efficiency Models",
                "manufacturerNumber": "EF-60T-125E-3N",
		"sourceURLs": [
			"http://www.bradfordwhite.com/sites/default/files/manuals-spec-sheets/commercial/gas-natural/"
		]
        },
        {
                "dataType": "product",
                "brand": "Bradford White",
                "name": "Ef Series Ultra High Efficiency Models",
                "manufacturerNumber": "EF-60T-150E-3N",
                "sourceURLs": [
                        "http://www.bradfordwhite.com/sites/default/files/manuals-spec-sheets/commercial/gas-natural/"
                ]
        },
        {
                "dataType": "product",
                "brand": "Bradford White",
                "name": "Ef Series Ultra High Efficiency Models",
                "manufacturerNumber": "EF-60T-199E-3N",
                "sourceURLs": [
                        "http://www.bradfordwhite.com/sites/default/files/manuals-spec-sheets/commercial/gas-natural/"
                ]
        }
]
        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    })

    it('tripadvisor', function(done){
      var needleResult = {
	"dataType": "business",
	"name": "Auberge Buena Vista",
	"address": "5.7 Avenue Kwame n'Krhuma, 09 BP 1247 Ouaga 09",
	"city": "Ouagadougou",
	"postalCode": "01",
	"country": "Burkina Faso",
	"province": "Ouagadougou",
	"descriptions": "Auberge Buena Vista, Ouagadougou: See reviews, articles, and 2 photos of Auberge Buena Vista, ranked No.12 on TripAdvisor among 12 attractions in Ouagadougou.",
	"lat": "12.36213",
	"long": "-1.517894",
	"email": "contact@auberge-buenavistaouaga.com",
	"images": [
		"https://media-cdn.tripadvisor.com/media/photo-t/03/be/c0/2a/auberge-buena-vista.jpg"
	],
	"phones": [
		"0022670027554"
	]
}
        var needleURL = 'http://tripadvisor.com/Attraction_Review-g293769-d1806977-Reviews-Auberge_Buena_Vista-Ouagadougou_Centre_Region.html';
        var test = eightyApp.finalizeRecord(needleResult, needleURL);

        var expectedObject = {
        "dataType": "business",
        "name": "Auberge Buena Vista",
        "address": "5.7 Avenue Kwame n'Krhuma, 09 BP 1247 Ouaga 09",
        "city": "Ouagadougou",
        "postalCode": "01",
        "country": "Burkina Faso",
        "province": "Ouagadougou",
        "descriptions": [
                {
                        "description": "Auberge Buena Vista, Ouagadougou: See reviews, articles, and 2 photos of Auberge Buena Vista, ranked No.12 on TripAdvisor among 12 attractions in Ouagadougou.",
                        "sourceURL": "http://tripadvisor.com/Attraction_Review-g293769-d1806977-Reviews-Auberge_Buena_Vista-Ouagadougou_Centre_Region.html"
                }
        ],
        "lat": "12.36213",
        "long": "-1.517894",
        "email": "contact@auberge-buenavistaouaga.com",
        "images": [
                "https://media-cdn.tripadvisor.com/media/photo-t/03/be/c0/2a/auberge-buena-vista.jpg"
        ],
        "phones": [
                "0022670027554"
        ],
	"sourceURLs": [
		"http://tripadvisor.com/Attraction_Review-g293769-d1806977-Reviews-Auberge_Buena_Vista-Ouagadougou_Centre_Region.html"
	]
}
        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    })
    it('streeteasy', function(done){
      var needleResult = {
	"dataType": "property",
	"name": "453 Fdr Drive C1601-1602",
	"address": "453 Fdr Drive C1601-1602",
	"size": "1600 sq. ft.",
	"numBedroom": "3",
	"numBathroom": "2",
	"prices": [
		{
			"dateSeen": "2016-10-26T20:42:04.654Z",
			"date": "2016-07-11T00:00:00.000Z",
			"offer": "Listed by Corcoran",
			"price": "USD 1600000",
			"pricePerSquareFoot": "USD 1000"
		},
		{
			"dateSeen": "2016-10-26T20:42:04.654Z",
			"date": "2016-08-16T00:00:00.000Z",
			"offer": "Listing entered contract",
			"price": "USD 1600000",
			"pricePerSquareFoot": "USD 1000"
		}
	],
	"city": "New York",
	"postalCode": "10002",
	"description": "Two adjacent apartments just combined and completely renovated to create an incredible 1600 sq. ft. three bedroom two bathroom home with breathtaking views of the East River, Corlears Hook Park, three bridges and the Financial District. This high floor apartment has three exposures (E/S/W) offering sunrise to sunset views and low monthly maintenance. Enter the welcoming foyer with two walk-in closets, custom lighting and an alcove office space. The main living space features an open kitchen with an extensive custom island with ample seating for eating, in addition to a separate dining area and large living room. The kitchen features brand new stainless steel appliances including a double door refrigerator with filtered water/ice maker, pull out under mount drawer microwave, dishwasher, gas range, under counter lighting, custom Shaker-style cabinetry and goose neck kitchen faucet. The living space contains both a corner picture window and full size kitchen window. At the far end of the main gallery you will find two corner bedrooms with full river views and walk in closets, as well as a subway tiled bathroom with soaking tub and two linen closets. An immense private master suite has been created with corner windows overlooking East River Park seating area oversize walk-in closet with window and en suite enlarged ceramic tiled master bathroom with glass enclosed shower stall with handheld and rain shower fixtures. Much attention to detail has been paid, including soffit and overhead lighting and sconces. Entirely new electrical throughout including fully wired for cable/internet. And there is much flexibility in how the space can best suit the needs of the new owner. East River Housing is located in a park-like setting in close proximity to East River Park and restaurants, galleries and boutiques on the Lower East Side. Resident fitness room, central laundry and 24-hour security and attended lobby. M14, M21 and M22 buses outside your door and F, J, M, Z, B, D trains at a short distance. Sorry no pets",
	"parking": "Parking Available",
	"country": "US",
	"province": "NY",
	"lat": "40.7129",
	"long": "-73.9789",
	"images": [
		"http://cdn-img0.streeteasy.com/nyc/image/0/217831600.jpg",
		"http://cdn-img0.streeteasy.com/nyc/image/92/217831592.jpg",
		"http://cdn-img0.streeteasy.com/nyc/image/84/217831584.jpg",
		"http://cdn-img3.streeteasy.com/nyc/image/75/217831575.jpg",
		"http://cdn-img2.streeteasy.com/nyc/image/62/217831562.jpg",
		"http://cdn-img2.streeteasy.com/nyc/image/54/217831554.jpg",
		"http://cdn-img1.streeteasy.com/nyc/image/45/217831545.jpg",
		"http://cdn-img3.streeteasy.com/nyc/image/31/217831531.jpg",
		"http://cdn-img2.streeteasy.com/nyc/image/10/217831510.jpg",
		"http://cdn-img0.streeteasy.com/nyc/image/0/217831500.jpg",
		"http://cdn-img1.streeteasy.com/nyc/image/89/217831489.jpg",
		"http://cdn-img0.streeteasy.com/nyc/image/80/217831480.jpg",
		"http://cdn-img1.streeteasy.com/nyc/image/5/217831505.jpg"
	],
	"listingType": "For Sale",
	"propertyType": "Co-op",
	"neighborhood": "Lower East Side",
	"fees": [
		{
			"amount": "USD 1430",
			"type": "Maintenance"
		}
	],
	"brokers": [
		{
			"agent": "Dianne Howard",
			"company": "Corcoran"
		},
		{
			"agent": "Nicholas Nicoletti",
			"company": "Corcoran"
		}
	],
	"features": [
		{
			"key": "Number of Rooms",
			"value": "5"
		},
		{
			"key": "Days On Market",
			"value": "36 days at Wed Oct 26 2016 20:42:04 GMT+0000 (UTC)"
		},
		{
			"key": "Building Amenities",
			"value": [
				"Children's Playroom",
				"Gym",
				"Laundry in Building",
				"Live-in Super",
				"Community Recreation Facilities"
			]
		},
		{
			"key": "Days On Market",
			"value": "36 days at Wed Oct 26 2016 20:42:04 GMT+0000 (UTC)"
		},
		{
			"key": "Outdoor Space",
			"value": "Patio"
		},
		{
			"key": "Highlights",
			"value": [
				"Doorman",
				"Elevator"
			]
		},
		{
			"key": "Nearby Subway Stations",
			"value": [
				"F J M Z at Delancey St-Essex St 0.58 miles",
				"F at East Broadway 0.59 miles",
				"B D at Grand St 0.85 miles",
				"F at 2nd Av 0.88 miles",
				"J Z at Bowery 0.91 miles"
			]
		}
	]
}
        var needleURL = 'http://streeteasy.com/building/455-fdr-drive-new_york/c16011602?80flag=For%20Sale';
        var test = eightyApp.finalizeRecord(needleResult, needleURL);

        var expectedObject = {
	"dataType": "property",
	"name": "453 Fdr Drive C1601-1602",
	"address": "453 Fdr Drive C1601-1602",
	"size": "1600 sq. ft.",
	"numBedroom": "3",
	"numBathroom": "2",
	"prices": [
		{
			"dateSeen": "2016-10-26T20:42:04.654Z",
			"date": "2016-07-11T00:00:00.000Z",
			"offer": "Listed by Corcoran",
			"price": "USD 1600000",
			"pricePerSquareFoot": "USD 1000",
			"sourceURL": "http://streeteasy.com/building/455-fdr-drive-new_york/c16011602"
		},
		{
			"dateSeen": "2016-10-26T20:42:04.654Z",
			"date": "2016-08-16T00:00:00.000Z",
			"offer": "Listing entered contract",
			"price": "USD 1600000",
			"pricePerSquareFoot": "USD 1000",
                        "sourceURL": "http://streeteasy.com/building/455-fdr-drive-new_york/c16011602"
		}
	],
	"city": "New York",
	"postalCode": "10002",
	"parking": "Parking Available",
	"country": "US",
	"province": "NY",
	"lat": "40.7129",
	"long": "-73.9789",
	"images": [
		"http://cdn-img0.streeteasy.com/nyc/image/0/217831600.jpg",
		"http://cdn-img0.streeteasy.com/nyc/image/92/217831592.jpg",
		"http://cdn-img0.streeteasy.com/nyc/image/84/217831584.jpg",
		"http://cdn-img3.streeteasy.com/nyc/image/75/217831575.jpg",
		"http://cdn-img2.streeteasy.com/nyc/image/62/217831562.jpg",
		"http://cdn-img2.streeteasy.com/nyc/image/54/217831554.jpg",
		"http://cdn-img1.streeteasy.com/nyc/image/45/217831545.jpg",
		"http://cdn-img3.streeteasy.com/nyc/image/31/217831531.jpg",
		"http://cdn-img2.streeteasy.com/nyc/image/10/217831510.jpg",
		"http://cdn-img0.streeteasy.com/nyc/image/0/217831500.jpg",
		"http://cdn-img1.streeteasy.com/nyc/image/89/217831489.jpg",
		"http://cdn-img0.streeteasy.com/nyc/image/80/217831480.jpg",
		"http://cdn-img1.streeteasy.com/nyc/image/5/217831505.jpg"
	],
	"listingType": "For Sale",
	"propertyType": "Co-op",
	"neighborhood": "Lower East Side",
	"fees": [
		{
			"amount": "USD 1430",
			"type": "Maintenance"
		}
	],
	"brokers": [
		{
			"agent": "Dianne Howard",
			"company": "Corcoran"
		},
		{
			"agent": "Nicholas Nicoletti",
			"company": "Corcoran"
		}
	],
	"features": [
		{
			"key": "Number of Rooms",
			"value": "5"
		},
		{
			"key": "Days On Market",
			"value": "36 days at Wed Oct 26 2016 20:42:04 GMT+0000 (UTC)"
		},
		{
			"key": "Building Amenities",
			"value": [
				"Children's Playroom",
				"Gym",
				"Laundry in Building",
				"Live-in Super",
				"Community Recreation Facilities"
			]
		},
		{
			"key": "Days On Market",
			"value": "36 days at Wed Oct 26 2016 20:42:04 GMT+0000 (UTC)"
		},
		{
			"key": "Outdoor Space",
			"value": "Patio"
		},
		{
			"key": "Highlights",
			"value": [
				"Doorman",
				"Elevator"
			]
		},
		{
			"key": "Nearby Subway Stations",
			"value": [
				"F J M Z at Delancey St-Essex St 0.58 miles",
				"F at East Broadway 0.59 miles",
				"B D at Grand St 0.85 miles",
				"F at 2nd Av 0.88 miles",
				"J Z at Bowery 0.91 miles"
			]
		}
	],
        "descriptions": [
                {
                        "description": "Two adjacent apartments just combined and completely renovated to create an incredible 1600 sq. ft. three bedroom two bathroom home with breathtaking views of the East River, Corlears Hook Park, three bridges and the Financial District. This high floor apartment has three exposures (E/S/W) offering sunrise to sunset views and low monthly maintenance. Enter the welcoming foyer with two walk-in closets, custom lighting and an alcove office space. The main living space features an open kitchen with an extensive custom island with ample seating for eating, in addition to a separate dining area and large living room. The kitchen features brand new stainless steel appliances including a double door refrigerator with filtered water/ice maker, pull out under mount drawer microwave, dishwasher, gas range, under counter lighting, custom Shaker-style cabinetry and goose neck kitchen faucet. The living space contains both a corner picture window and full size kitchen window. At the far end of the main gallery you will find two corner bedrooms with full river views and walk in closets, as well as a subway tiled bathroom with soaking tub and two linen closets. An immense private master suite has been created with corner windows overlooking East River Park seating area oversize walk-in closet with window and en suite enlarged ceramic tiled master bathroom with glass enclosed shower stall with handheld and rain shower fixtures. Much attention to detail has been paid, including soffit and overhead lighting and sconces. Entirely new electrical throughout including fully wired for cable/internet. And there is much flexibility in how the space can best suit the needs of the new owner. East River Housing is located in a park-like setting in close proximity to East River Park and restaurants, galleries and boutiques on the Lower East Side. Resident fitness room, central laundry and 24-hour security and attended lobby. M14, M21 and M22 buses outside your door and F, J, M, Z, B, D trains at a short distance. Sorry no pets",
                        "sourceURL": "http://streeteasy.com/building/455-fdr-drive-new_york/c16011602"
                }
        ],
	"sourceURLs": [
		"http://streeteasy.com/building/455-fdr-drive-new_york/c16011602"
	]
}

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    })
    it('Record 1', function(done){
        var needleResult = {
          dataType: 'product',
          description: 'This is a description.',
          prices: [
            {
              price: 'USD 5.00',
              color: 'blue'
            }
          ],
          sku: '12345'
        }
        var needleURL = 'http://www.80legs.com';
        var test = eightyApp.finalizeRecord(needleResult, needleURL);

        var expectedObject = {
          dataType: 'product',
          prices: [
            {
              price: 'USD 5.00',
              color: 'blue',
              sourceURL: 'http://www.80legs.com'
            }
          ],
          descriptions: [
            {
              description: 'This is a description.',
              sourceURL: 'http://www.80legs.com'
            }
          ],
          skus: [
            {
              sku: '12345',
              sourceURL: 'http://www.80legs.com'
            }
          ],
          sourceURLs: [
            'http://www.80legs.com'
	  ]
        }

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    })
})

/* UPDATES: 10-20-2016                                                          
 * Added function to convert alphanumeric phone numbers to numeric ones         
 */                                                                             
describe("convertAlphanumericPhone", function() {                               
    eightyApp = new EightyAppBase();                                            
    it('does not harm numeric phone', function(done) {                          
        var phone = "8303794354";                                               
        var test = eightyApp.convertAlphanumericPhone(phone);                   
        expect(test).to.equal(phone);                                           
        done()
    })                                                                          
    it('properly converts alphanumeric number without hyphens', function(done) {
        var phone = "18007777EBT";                                              
        var test = eightyApp.convertAlphanumericPhone(phone);                   
        expect(test).to.equal("18007777328");                                   
        done()
    })                                                                          
    it('properly converts alphanumeric number with hyphens', function(done) {   
        var phone = "770-382-GOLD";                                             
        var test = eightyApp.convertAlphanumericPhone(phone);                   
        expect(test).to.equal("770-382-4653");                                  
        done()
    })                                                                          
})   
