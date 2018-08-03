let fs = require('fs');
let expect = require('chai').expect;
let cheerio = require('cheerio');
let EightyAppBase = require('../EightyApp.js');

/* ************************** */
/* ***** HELPER METHODS ***** */
/* ************************** */
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

let eightyApp;
let expected;
let actual;
let testObj;

//TO RUN TESTS: node_modules/mocha/bin/mocha test.js
describe('parseXml', function(){
    let sampleXml;

    before(function(){
        sampleXml = fs.readFileSync(__dirname + '/fixtures/sampleXml.xml');
        eightyApp = new EightyAppBase();
    });

    it ('parses an xml string', function(done){
        let $xml = eightyApp.parseXml(sampleXml.toString(), cheerio);
        let test = $xml.find('product[number=1] img80').text().trim();

        expect(test).to.equal('https://a248.e.akamai.net/f/248/9086/10h/origin-d2.scene7.com/is/image/Coach/q6173_blk_a0');
        done();
    });
});

/* UPDATES: 7-30-2018
 * Testing: Functionalilty of convert24HourTime function
 * 80app: Added convert24HourTime function that converts 24 hour time to well formed 12 hour time string
 */
describe('convert24HourTime', function() {
    before(function() {
        eightyApp = new EightyAppBase();
    });

    it ('Returns empty string for falsey input', function(done) {
        testObj = null;
        expected = '';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);

        testObj = undefined;
        expected = '';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);

        testObj = '';
        expected = '';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);
        done();
    });

    it ('Appends AM to hours less than 12', function(done) {
        testObj = '11:11';
        expected = '11:11 AM';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);

        testObj = '4:20';
        expected = '4:20 AM';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);

        testObj = '1:00';
        expected = '1:00 AM';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);
        done();
    });

    it ('Returns empty string for invalid time strings', function(done) {
        testObj = 'This is not a valid time';
        expected = '';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);

        testObj = '36:00';
        expected = '';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);
        done();
    });

    it ('Converts hours greater than 12 to the corresponding PM time', function(done) {
        testObj = '16:20';
        expected = '4:20 PM';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);

        testObj = '22:45';
        expected = '10:45 PM';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);
        done();
    });

    it ('Works on 0 and 24 hours', function(done) {
        testObj = '24:00';
        expected = '12:00 AM';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);

        testObj = '0:00';
        expected = '12:00 AM';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);
        done();
    });

    it ('Works if no minutes are provided', function(done) {
        testObj = '8';
        expected = '8 AM';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);

        testObj = '17';
        expected = '5 PM';
        actual = eightyApp.convert24HourTime(testObj);
        expect(expected).to.equal(actual);
        done();
    });
});

/* UPDATES: 7-30-2018
 * Testing: Functionalilty of getNumberValue function
 * 80app: Added getNumberValue function that extracts number expressions from text
 */
describe('getNumberValue', function() {
    let expected;
    let actual;
    before(function() {
        eightyApp = new EightyAppBase();
        testObj = {
            testString : '',
            regex : null
        };
    });

    it ('Throws a type error when not passed a valid regexp', function(done) {
        try {
            testObj.regex = 'not a regexp';
            testObj.testString = 'does not even matter what this is';
            eightyApp.getNumberValue(testObj.testString, testObj.regex);
        } catch (e) {
            expected = true;
            actual = true;
            expect(actual).to.equal(expected);
        }
        done();
    });

    it ('Returns an empty string if passed an invalid string or empty regex', function(done) {
        testObj.testString = null;
        testObj.regex = /this is a test/;
        expected = '';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = '';
        testObj.regex = /test/;
        expected = '';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = 'this is a test';
        testObj.regex = new RegExp();
        expected = '';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        done();
    });

    it ('Returns empty string if regex match not found', function(done) {
        testObj.testString = 'I have 15 objects';
        testObj.regex = /not found/;
        expected = '';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        done();
    });

    it ('Returns the closest whole number to the matched regex', function(done) {
        testObj.testString = 'I have 5 dogs';
        testObj.regex = /dogs/;
        expected = '5';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = 'The number of dogs I have is 5';
        testObj.regex = /dogs/;
        expected = '5';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = 'I have 5 dogs and 3 cats';
        testObj.regex = /dogs/;
        expected = '5';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = 'I have 5 dogs and 3 cats';
        testObj.regex = /cats/;
        expected = '3';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        done();
    });

    it ('Can handle various number expressions with decimals and dashes', function(done) {
        testObj.testString = 'I have 4.5 dogs and 3 cats'; // half a dog sounds inhumane
        testObj.regex = /dogs/;
        expected = '4.5';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = 'I have 4-5 dogs';
        testObj.regex = /dogs/;
        expected = '4-5';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = 'The temperature is -32 degrees celsius';
        testObj.regex = /degrees/;
        expected = '-32';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = '0.9-1.2% APR for well qualified buyers';
        testObj.regex = /apr/i;
        expected = '0.9-1.2';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        done();
    });

    it ('Excludes symbols not part of the number expression', function(done) {
        testObj.testString = 'The car costs $4,123,544';
        testObj.regex = /\$/;
        expected = '4123544';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = 'The number of dogs I have is 2.';
        testObj.regex = /dogs/;
        expected = '2';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        done();
    });

    it ('Can handle numeric regexps', function(done) {
        testObj.testString = 'I have 1 4.0';
        testObj.regex = /4.0/;
        expected = '1';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = 'The judges awared 4 5s and 5 4s';
        testObj.regex = /5/;
        expected = '4';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        done();
    });

    it ('Can handle variable regexps', function(done) {
        testObj.testString = 'I have 1 foo.barbarbarfoofoo';
        testObj.regex = /(foo)+\.?(bar)*\.?(foo)*/;
        expected = '1';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        done();
    });

    it ('does not have extensive NLP abilities', function(done) {
        testObj.testString = 'I have five dogs';
        testObj.regex = /dogs/;
        expected = '';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = 'I have way less than 100 dogs';
        testObj.regex = /dogs/;
        expected = '100';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        testObj.testString = 'I do not have 2 dogs';
        testObj.regex = /dogs/;
        expected = '2';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        // Doesn't understand context, only returns the number closest the match
        testObj.testString = 'I have 2 cats, but dogs? I have way more than that. I have 5';
        testObj.regex = /dogs/;
        expected = '2';
        actual = eightyApp.getNumberValue(testObj.testString, testObj.regex);
        expect(actual).to.equal(expected);

        done();
    });
});

/* UPDATES: 7-6-2018
 * Testing: Functionalilty of trimObject function
 * 80app: Added trimObject function that trims all nested strings in an object
 */
describe('trimObject', function() {
    before(function() {
        eightyApp = new EightyAppBase();
    });

    it ('doesn\'t modify falsey values', function(done) {
        testObj = null;
        expected = null;
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.equal(expected);

        testObj = '';
        expected = '';
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.equal(expected);

        testObj = {};
        expected = {};
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.deep.equal(expected);

        testObj = [];
        expected = [];
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });

    it ('doesn\'t modify non string elements', function(done) {
        testObj = [1, 2, 3];
        expected = testObj;
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });

    it ('removes extra whitespace from strings', function(done) {
        testObj = 'test';
        expected = 'test';
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.equal(expected);

        testObj = ' test ';
        expected = 'test';
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.equal(expected);

        testObj = 'this    is \n a \t\t\n test    ';
        expected = 'this is a test';
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.equal(expected);
        done();
    });

    it ('works on arrays', function(done) {
        testObj = ['this  ', ' is   ', '\na', ' test '];
        expected = ['this', 'is', 'a', 'test'];
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });

    it ('works on objects', function(done) {
        testObj = { a : ' this is \n a test   ' };
        expected = { a : 'this is a test' };
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });

    it ('works on deeply nested strings', function(done) {
        testObj = { this : [ 'is   ', { is : [ 'a  ', { a : [ '  test '] } ] } ] };
        expected = { this : ['is', { is : [ 'a', { a : ['test'] }] }] };
        actual = eightyApp.trimObject(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });
});

/* UPDATES: 7-6-2018
 * Testing: Functionalilty of isValid function
 * 80app: Added isValid function that determines if a value should be returned from an extractor function
 */
describe('isValid', function() {
    let testObj;
    let eightyApp;
    let expected;
    let actual;
    before (function() {
        eightyApp = new EightyAppBase();
    });

    it ('returns false if object is falsey', function(done) {
        testObj = null;
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = undefined;
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = NaN;
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = '';
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);
        done();
    });

    it ('returns false for empty containers', function(done) {
        testObj = [];
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = {};
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);
        done();
    });

    it ('returns false for negative numbers and strings with just whitespace', function(done) {
        testObj = -1;
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = -1.0;
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = -0.0001;
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = '    ';
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);
        done();
    });

    it ('returns false for invalid date objects', function(done) {
        testObj = new Date('not a valid date');
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);
        done();
    });

    it ('returns false for empty DOM elements', function(done) {
        let $ = cheerio.load('<h2 class="test">This is test HTML</h2>');
        testObj = $('not_a_tag');
        expected = false;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);
        done();
    });

    it ('returns true for all other values', function(done) {
        testObj = [''];
        expected = true;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = { a : '' };
        expected = true;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = -0;
        expected = true;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = 'this is a test';
        expected = true;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        let $ = cheerio.load('<h2 class="valid_selector">This is test HTML</h2>');
        testObj = $('.valid_selector');
        expected = true;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);

        testObj = new Date();
        expected = true;
        actual = eightyApp.isValid(testObj);
        expect(expected).to.equal(actual);
        done();

    });
});

/* UPDATES: 7-6-2018
 * Testing: Functionalilty of removeAllDuplicates function
 * 80app: Added removeAllDuplicates function that compares objects as well as primitives
 */
describe('removeAllDuplicates', function() {
    before(function() {
        eightyApp = new EightyAppBase();
        expected = {};
        actual = {};
    });

    it ('returns null when called on primitive or array', function(done) {
        // primitives
        expected = null;
        actual = eightyApp.removeAllDuplicates(5);
        expect(expected).to.equal(actual);
        actual = eightyApp.removeAllDuplicates('hello world');
        expect(expected).to.equal(actual);

        // Array
        actual = eightyApp.removeAllDuplicates([1,2,2]);
        expect(expected).to.equal(actual);
        done();
    });

    it ('has no effect on non-list fields', function(done) {
        testObj = { a : 'a', b : 'a' };
        expected = testObj;
        actual = eightyApp.removeAllDuplicates(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });

    it ('removes duplicate primitives from list fields', function(done) {
        testObj = { lstWithDups : [ '1', '2', '2', 2, 1, '3'] };
        expected = { lstWithDups : [ '1', '2', 2, 1, '3'] };
        actual = eightyApp.removeAllDuplicates(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });

    it ('removes duplicate objects from list fields', function(done) {
        let obj1 = { a : 'a' };
        let obj2 = { a : 'a' };
        let obj3 = { a : 'eyyyyy' };
        testObj = { lstWithDupObjs : [ obj1, obj3, obj2 ] };
        expected = { lstWithDupObjs : [ obj1, obj3 ] };
        actual = eightyApp.removeAllDuplicates(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });

    it ('compares strings by trimming first and case insensitive comparison', function(done) {
        let obj1 = { a : ' this    is a test      ' };
        let obj2 = { a : 'tHis is A Test' };
        let obj3 = { a : 'this is also a test' };
        testObj = { lstWithDupObjs : [ obj1, obj3, obj2 ] };
        expected = { lstWithDupObjs : [ obj1, obj3 ] };
        actual = eightyApp.removeAllDuplicates(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });

    it ('compares deeply nested elements', function(done) {
        let obj1 =  { a : [ { test : [ 'this is a test' ] } ] };
        let obj2 =  { a : [ { test : [ 'this iS    a test' ] } ] };
        testObj = { lstWithDupObjs : [ obj1, obj2 ] };
        expected = { lstWithDupObjs : [ obj1 ] };
        actual = eightyApp.removeAllDuplicates(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });

    it ('is not recursive', function(done) {
        let obj1 = { a : [ { test : [ 1, 1, 1 ] } ] };
        testObj = { lstWithSingleObj : [ obj1 ] };
        expected = testObj;
        actual = eightyApp.removeAllDuplicates(testObj);
        expect(actual).to.deep.equal(expected);
        done();
    });
});

/* UPDATES: 8-13-2015
 * Testing: Added coverage for invalid input and added coverage for proper function behavior
 * 80app: Added code block to check for invalid input
 * IMPORTANT: have function account for array of objects.
 */
describe('eliminateDuplicates', function(){
    let eightyApp = new EightyAppBase();
    //Testing letiables
    let array;
    let test;
    it('returns \'null\' when called with no arguments', function(done){
        test = eightyApp.eliminateDuplicates();
        expect(test).to.equal(null);
        done();
    });
    it('returns \'null\' when called with a false argument', function(done){
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
    it('returns an empty array if called with an empty array', function(done){
        array = [];
        test = arraysEqual([], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);
        done();
    });
    it('does not modify arrays with no duplicates', function(done){
        array = [1];
        test = arraysEqual([1], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = ['a'];
        test = arraysEqual(['a'], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = [1,2,3,4,5,6,7,8,9];
        test = arraysEqual([1,2,3,4,5,6,7,8,9], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = ['a','b','c','d','e','f','g'];
        test = arraysEqual(['a','b','c','d','e','f','g'], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);
        done();
    });
    it('eliminates empty elements', function(done){
        array = ['abc', 'ab', ''];
        test = arraysEqual(['abc', 'ab'], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);
        done();
    });
    it('eliminates duplicates', function(done){
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

        array = ['a','a'];
        test = arraysEqual(['a'], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = ['a','a','b','b','c','c'];
        test = arraysEqual(['a','b','c'], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);

        array = ['a','b','a','c','b','c'];
        test = arraysEqual(['a','b','c'], eightyApp.eliminateDuplicates(array));
        expect(test).to.equal(true);
        done();
    });
});//describe: "eliminateDuplicates"

/* UPDATES: 8-11-2015
 * Expanded testing for false input
 * Modified 80app to handle all false input, not just 'undefined'
 */
describe('makeLink', function(){
    eightyApp = new EightyAppBase();
    it('appends the path to the domain', function(done){
        let domain = 'www.80legs.com';
        let link = '/index.html';
        let test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/index.html');

        domain = 'http://www.80legs.com/';
        link = '/plans.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/plans.html');

        domain = 'http://www.80legs.com';
        link = 'plans.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/plans.html');

        domain = 'http://www.80legs.com/';
        link = 'plans.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/plans.html');

        domain = 'http://www.80legs.com';
        link = '/plans.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/plans.html');

        domain = '80legs.com';
        link = '/plans.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://80legs.com/plans.html');

        domain = 'http://80legs.com';
        link = '80legs.com/plans.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://80legs.com/plans.html');

        domain = 'http://80legs.com';
        link = 'http://www.80legs.com/plans.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/plans.html');

        domain = 'www.80legs.com';
        link = '80legs.com/plans.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://80legs.com/plans.html');

        domain = 'www.80legs.com';
        link = '/';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/');

        domain = 'www.80legs.com/en/contact/';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/prices.html');

        domain = 'www.80legs.co.uk/en/contact/';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.co.uk/prices.html');

        domain = 'www.80legs.com?q=dog:bark';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/prices.html');

        domain = 'www.80legs.co.uk?q=dog:bark';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.co.uk/prices.html');

        domain = 'http://80legs.co.uk?q=dog:bark';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://80legs.co.uk/prices.html');

        domain = 'http://www.80legs.co.uk?q=dog:bark';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.co.uk/prices.html');

        domain = 'https://80legs.com/en/contact/';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('https://80legs.com/prices.html');

        domain = 'https://80legs.com/en/contact/index.html';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('https://80legs.com/prices.html');

        domain = 'https://80legs.com/index.html';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('https://80legs.com/prices.html');

        domain = 'https://www.80legs.com/en/contact/';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('https://www.80legs.com/prices.html');

        domain = 'www.beef-is-smelly.co.uk?q=dog:bark';
        link = '/prices.html';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.beef-is-smelly.co.uk/prices.html');

        domain = 'www.80legs.com/';
        link = '/';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/');

        domain = 'www.80legs.com';
        link = '#';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/#');

        domain = 'www.80legs.com/';
        link = '#';
        test = eightyApp.makeLink(domain, link);
        expect(test).to.equal('http://www.80legs.com/#');

        done();
    });//it: ("appends the path to the domain")

    it('returns \'null\' when called with no arguments', function(done){
        let test = eightyApp.makeLink();
        expect(test).to.equal(null);
        done();
    });

    it('returns the input argument when called with only one argument', function(done){
        let domain = 'www.80legs.com';
        let test = eightyApp.makeLink(domain);
        expect(test).to.equal('www.80legs.com');
        done();
    });

    it('returns the domain when called with a false href', function(done){
        let domain = 'www.80legs.com';
        let href = undefined;
        let test = eightyApp.makeLink(domain, href);
        expect(test).to.equal('www.80legs.com');
        done();
    });

    it('returns the href when called with a false domain', function(done){
        let domain = undefined;
        let href = '/prices.html';
        let test = eightyApp.makeLink(domain, href);
        expect(test).to.equal('/prices.html');
        done();
    });
});

/* UPDATES: 8-11-2015
 * Testing: Expanded coverage for invalid input handling, added coverage for proper function behavior
 * 80app: Fixed adding flags to links with a '&' at the end
 */
describe('append80FlagToLink ', function(){
    let eightyApp = new EightyAppBase();
    it('returns \'null\' when called with no arguments', function(done){
        let test = eightyApp.append80FlagToLink();
        expect(test).to.equal(null);
        done();
    });
    it('returns eighty value when called with false link', function(done){
        let eightyValue = 'defined';

        //null
        let link = null;
        let test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('defined');

        //undefined
        link = undefined;
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('defined');

        //empty string
        link = '';
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('defined');
        done();
    });
    it('returns link when called with false eighty value', function(done){
        let link = 'http://www.test.com/';

        //null
        let eightyValue = null;
        let test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('http://www.test.com/');

        //undefined
        eightyValue = undefined;
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('http://www.test.com/');

        //empty string
        eightyValue = '';
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('http://www.test.com/');
        done();
    });
    it('appends 80flag to links without any flags', function(done){
        let link = 'http://www.test.com';
        let eightyValue = 'test';
        let test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('http://www.test.com?80flag=test');

        link = 'http://www.test.com/';
        eightyValue = 'test';
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('http://www.test.com/?80flag=test');

        link = 'http://www.test.com?';
        eightyValue = 'test';
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('http://www.test.com?80flag=test');
        done();
    });
    it('appends 80flag to links with existing flags', function(done){
        let link = 'http://www.test.com?flag=donotmodify';
        let eightyValue = 'test';
        let test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('http://www.test.com?flag=donotmodify&80flag=test');

        link = 'http://www.test.com?flag=donotmodify&';
        eightyValue = 'test';
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('http://www.test.com?flag=donotmodify&80flag=test');

        link = 'http://www.test.com?flag1=do&flag2=not&flag3=modify';
        eightyValue = 'test';
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('http://www.test.com?flag1=do&flag2=not&flag3=modify&80flag=test');
        done();
    });
    it('Handles 80flags with URI forbidden characters', function(done) {
        let link = 'http://www.test.com/';
        let eightyValue = 'a test with ampersands & questionmarks ?';
        let test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('http://www.test.com/?80flag=a%20test%20with%20ampersands%20%26%20questionmarks%20%3F');

        link = 'https://www.bodybuilding.com/store/opt/whey.html?skuId=OPT340';
        eightyValue = '["Sports Nutrition & Workout Support"]';
        test = eightyApp.append80FlagToLink(eightyValue, link);
        expect(test).to.equal('https://www.bodybuilding.com/store/opt/whey.html?skuId=OPT340&80flag=%5B%22Sports%20Nutrition%20%26%20Workout%20Support%22%5D');
        done();
    });
});//describe: "append80FlagToLink"

describe('get80Value', function(){
    eightyApp = new EightyAppBase();

    it('returns null if null is passed in as an argument', function(done){
        let url = null;
        let test = eightyApp.get80Value(url);
        expect(test).to.equal(null);
        done();
    });

    it('returns null if undefined is passed in as an argument', function(done){
        let url = undefined;
        let test = eightyApp.get80Value(url);
        expect(test).to.equal(null);
        done();
    });

    it('returns null if a url is passed in that has no 80flag', function(done){
        let url = 'http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?id=pcmcat333800050003';
        let test = eightyApp.get80Value(url);
        expect(test).to.equal(null);
        done();
    });

    it('returns an empty string if the 80flag= query parameter has no value', function(done){
        let url = 'http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?id=pcmcat333800050003&80flag=';
        let test = eightyApp.get80Value(url);
        expect(test).to.equal('');
        done();
    });

    it('returns null if the word 80flag is in the string with no value', function(done){
        let url = 'http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?id=pcmcat333800050003&80flag';
        let test = eightyApp.get80Value(url);
        expect(test).to.equal(null);
        done();
    });

    it('returns the eighty value if there is one', function(done){
        let url = 'http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?id=pcmcat333800050003&80flag=test1';
        let test = eightyApp.get80Value(url);
        expect(test).to.equal('test1');

        url = 'http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?80flag=test2';
        test = eightyApp.get80Value(url);
        expect(test).to.equal('test2');
        done();
    });

    it('returns only the eighty value if followed by another parameter', function(done){
        let url = 'http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?80flag=test1&parameter=bad';
        let test = eightyApp.get80Value(url);
        expect(test).to.equal('test1');

        url = 'http://www.bestbuy.com/site/tvs/4k-ultra-hd-tvs/pcmcat333800050003.c?parameter1=bad&80flag=test2&parameter2=alsoBad';
        test = eightyApp.get80Value(url);
        expect(test).to.equal('test2');
        done();
    });
    it('handles URI encoded 80flags and properly decodes them', function(done) {
        let url = 'http://www.test.com/?80flag=a%20test%20with%20ampersands%20%26%20questionmarks%20%3F';
        let test = eightyApp.get80Value(url);
        expect(test).to.equal('a test with ampersands & questionmarks ?');

        url = 'https://www.bodybuilding.com/store/opt/whey.html?skuId=OPT340&80flag=%5B%22Sports%20Nutrition%20%26%20Workout%20Support%22%5D';
        test = eightyApp.get80Value(url);
        expect(test).to.equal('["Sports Nutrition & Workout Support"]');
        done();
    });
});//describe: "get80Value"

//IMPORTANT: Fix punctuation regex!
describe('getPlainText', function(){
    let eightyApp = new EightyAppBase();

    //TEST CASES FROM removeExtraWhitespace - behavior should be the same
    it('returns empty string for false input', function(done){
        let string = undefined;
        let test = eightyApp.getPlainText(string);
        expect(test).to.equal('');

        string = null;
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('');

        string = '';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('');
        done();
    });

    it('removes beginning and end whitespaces', function(done){
        //Trailing space
        let string = 'test ';
        let test = eightyApp.getPlainText(string);
        expect(test).to.equal('test');

        //Beginning space
        string = ' test';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('test');

        //Spaces on both ends
        string = ' test ';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('test');

        //Double spaces on both ends
        string = '  test  ';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('test');
        done();

        //Other whitespace on both ends
        string = '\ttest\r';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('test');

        string = '\ntest\v';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('test');

        string = '\ftest ';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('test');

        //Removes double whitespace on both ends
        string = '\t\rtest\n\v';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('test');

        string = '\v\ftest\r\t';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('test');
    });

    it('removes multiple whitespace', function(done){
        let string = 'a  b  c  d  e';
        let test = eightyApp.getPlainText(string);
        expect(test).to.equal('a b c d e');

        string = 'a  b\t\tc\r\rd\n\ne\v\vf\f\fg';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('a b c d e f g');

        string = 'a \tb\t\rc\r\nd\n\ve\v\ff\f g';
        test = eightyApp.getPlainText(string);
        expect(test).to.equal('a b c d e f g');
        done();
    });

    it('changes all whitespace characters to space', function(done){
        let string = 'a b\tc\rd\ne\vf\fg';
        let test = eightyApp.getPlainText(string);
        expect(test).to.equal('a b c d e f g');
        done();
    });

    //TEST CASES EXCLUSIVE TO: getPlainText
    it('preserves A-Z characters, ignoring case', function(done){
        let string = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let test = eightyApp.getPlainText(string);
        expect(test).to.equal('abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        done();
    });

    it('preserves 0-9 characters', function(done){
        let string = '0 1 2 3 4 5 6 7 8 9';
        let test = eightyApp.getPlainText(string);
        expect(test).to.equal('0 1 2 3 4 5 6 7 8 9');
        done();
    });

    it('preserves certain [.\'-:!] punctuation', function(done){ //NOTE: Weird behavior here regarding '-: -> ask Moe about it
        let string = 'a.b\'c-d:e!f';
        let test = eightyApp.getPlainText(string);
        expect(test).to.equal('a.b\'c-d:e!f');
        done();
    });

    it('removes special characters', function(done){
        let string = 'ÄäÇçĞğİıÖöŞşÜüßàáâãèéêëěìíîïñòóôõřùúûýÿÀÁÂÃÈÉÊËÌÍÎÏÑÒÓÔÕÙÚÛÝ';
        let test = eightyApp.getPlainText(string);
        expect(test).to.equal('');
        done();
    });

    it('removes non-allowed punctuation', function(done){ //NOTE: Expand here after discussion with Moe
        let string = 'a;b';
        let test = eightyApp.getPlainText(string);
        expect(test).to.equal('ab');
        done();
    });
});//describe: "getPlainText"

describe('getProperCase', function(){
    eightyApp = new EightyAppBase();

    it('US city', function(done){
        let arg0 = 'san diego';
        let test = eightyApp.getProperCase(arg0);
        expect(test).to.equal('San Diego');
        done();
    });

    it('Foreign city', function(done){
        let arg0 = 'cuidado íntimo';
        let test = eightyApp.getProperCase(arg0);
        expect(test).to.equal('Cuidado Íntimo');
        done();
    });

    it('Fon du lac', function(done){
        let arg0 = 'fon du lac';
        let test = eightyApp.getProperCase(arg0);
        expect(test).to.equal('Fon Du Lac');
        done();
    });

    it('Lake in the hills', function(done){
        let arg0 = 'lake in the hills';
        let test = eightyApp.getProperCase(arg0);
        expect(test).to.equal('Lake In The Hills');
        done();
    });
});

/* UPDATES: 8/10/2015
 * Added block to catch invalid input
 * Added 'else' to return just the text if a non-recognized currency is input
 */
describe('getPriceRangeReplace', function(){
    eightyApp = new EightyAppBase();

    it('returns empty object when called with no arguments', function(done){
        let test = eightyApp.getPriceRangeReplace();
        expect(JSON.stringify(test)).to.equal(JSON.stringify({}));
        done();
    });

    it('returns empty object when called with false text', function(done){
        //null
        let arg0 = null;
        let test = eightyApp.getPriceRangeReplace(arg0, 'USD');
        expect(JSON.stringify(test)).to.equal(JSON.stringify({}));

        //undefined
        arg0 = undefined;
        test = eightyApp.getPriceRangeReplace(arg0, 'USD');
        expect(JSON.stringify(test)).to.equal(JSON.stringify({}));

        //empty string
        arg0 = '';
        test = eightyApp.getPriceRangeReplace(arg0, 'USD');
        expect(JSON.stringify(test)).to.equal(JSON.stringify({}));
        done();
    });

    it('returns empty object when called with false currency', function(done){
        let validText = 'defined';
        //null
        let arg1 = null;
        let test = eightyApp.getPriceRangeReplace(validText, arg1);
        expect(JSON.stringify(test)).to.equal(JSON.stringify({}));

        //undefined
        arg1 = undefined;
        test = eightyApp.getPriceRangeReplace(validText, arg1);
        expect(JSON.stringify(test)).to.equal(JSON.stringify({}));

        //empty string
        arg1 = '';
        test = eightyApp.getPriceRangeReplace(validText, arg1);
        expect(JSON.stringify(test)).to.equal(JSON.stringify({}));
        done();
    });

    it('returns empty object when called with false text and false currency', function(done){
        //null
        let arg0 = null;
        let arg1 = null;
        let test = eightyApp.getPriceRangeReplace(arg0, arg1);
        expect(JSON.stringify(test)).to.equal(JSON.stringify({}));

        //undefined
        arg0 = undefined;
        arg1 = undefined;
        test = eightyApp.getPriceRangeReplace(arg0, arg1);
        expect(JSON.stringify(test)).to.equal(JSON.stringify({}));

        //empty string
        arg0 = '';
        arg1 = '';
        test = eightyApp.getPriceRangeReplace(arg0, arg1);
        expect(JSON.stringify(test)).to.equal(JSON.stringify({}));
        done();
    });

    it('replaces USD currency ranges correctly', function(done){
        let arg = '$$$';
        let test = eightyApp.getPriceRangeReplace(arg, 'USD');
        expect(JSON.stringify(test)).to.equal(JSON.stringify({ priceRangeCurrency: 'USD', priceRangeMin: 40, priceRangeMax: 55 }));
        done();
    });

    it('replaces GBP currency ranges correctly', function(done){
        let arg = '£££';
        let test = eightyApp.getPriceRangeReplace(arg, 'GBP');
        expect(JSON.stringify(test)).to.equal(JSON.stringify({ priceRangeCurrency: 'GBP', priceRangeMin: 25, priceRangeMax: 35 }));
        done();
    });

    it('replaces YEN currency ranges correctly', function(done){
        let arg = '¥¥¥';
        let test = eightyApp.getPriceRangeReplace(arg, 'YEN');
        expect(JSON.stringify(test)).to.equal(JSON.stringify({ priceRangeCurrency: 'YEN', priceRangeMin: 4491, priceRangeMax: 6175 }));
        done();
    });

    it('replaces EUR currency ranges correctly', function(done){
        let arg = '€€€';
        let test = eightyApp.getPriceRangeReplace(arg, 'EUR');
        expect(JSON.stringify(test)).to.equal(JSON.stringify({ priceRangeCurrency: 'EUR', priceRangeMin: 34, priceRangeMax: 47 }));
        done();
    });
});//describe: "getPriceRangeReplace"

/* UPDATES: 8-11-2015
 * Testing: Added coverage for proper function behavior, expanded coverage for invalid input
 * 80app: Changed method to select characters to more be more efficient (secondLastChar and thirdLastChar)
 */
describe('normalizePrice ', function(){
    let eightyApp = new EightyAppBase();

    it('returns \'null\' when called with no arguments', function(done){
        let test = eightyApp.normalizePrice();
        expect(test).to.equal(null);
        done();
    });

    it('returns \'null\' when called with invalid arguments', function(done){
        //null
        let arg = null;
        let test = eightyApp.normalizePrice(arg);
        expect(test).to.equal(null);

        //undefined
        arg = undefined;
        test = eightyApp.normalizePrice(arg);
        expect(test).to.equal(null);

        //empty string
        arg = '';
        test = eightyApp.normalizePrice(arg);
        expect(test).to.equal(null);
        done();
    });

    it('normalizes prices with no decimal digits correctly', function(done){
        let string = '1';
        let test = eightyApp.normalizePrice(string);
        expect(test).to.equal('1.00');

        string = '1234';
        test = eightyApp.normalizePrice(string);
        expect(test).to.equal('1234.00');

        string = '123,456,789';
        test = eightyApp.normalizePrice(string);
        expect(test).to.equal('123456789.00');
        done();
    });

    it('normalizes prices with one digit after decimal place correctly', function(done){
        let string = '123.4';
        let test = eightyApp.normalizePrice(string);
        expect(test).to.equal('123.40');

        string = '123,4';
        test = eightyApp.normalizePrice(string);
        expect(test).to.equal('123.40');
        done();
    });

    it('normalizes prices with two digits after decimal place correctly', function(done){
        let string = '123.45';
        let test = eightyApp.normalizePrice(string);
        expect(test).to.equal('123.45');

        string = '123,45';
        test = eightyApp.normalizePrice(string);
        expect(test).to.equal('123.45');
        done();
    });

    it('normalizes prices with more than two digits after decimal place correctly', function(done){
        let string = '5.777777777777778';
        let test = eightyApp.normalizePrice(string);
        expect(test).to.equal('5.78');
        done();
    });
});//describe: "normalizePrice"

describe('removeExtraWhitespace', function(){
    eightyApp = new EightyAppBase();

    it('returns empty string for false input', function(done){
        let string = undefined;
        let test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('');

        string = null;
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('');

        string = '';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('');
        done();
    });

    it('removes beginning and end whitespaces', function(done){
        //Trailing space
        let string = 'test ';
        let test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('test');

        //Beginning space
        string = ' test';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('test');

        //Spaces on both ends
        string = ' test ';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('test');

        //Double spaces on both ends
        string = '  test  ';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('test');
        done();

        //Other whitespace on both ends
        string = '\ttest\r';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('test');

        string = '\ntest\v';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('test');

        string = '\ftest ';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('test');

        //Removes double whitespace on both ends
        string = '\t\rtest\n\v';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('test');

        string = '\v\ftest\r\t';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('test');
    });

    it('removes multiple whitespace', function(done){
        let string = 'a  b  c  d  e';
        let test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('a b c d e');

        string = 'a  b\t\tc\r\rd\n\ne\v\vf\f\fg';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('a b c d e f g');

        string = 'a \tb\t\rc\r\nd\n\ve\v\ff\f g';
        test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('a b c d e f g');
        done();
    });

    it('changes all whitespace characters to space', function(done){
        let string = 'a b\tc\rd\ne\vf\fg';
        let test = eightyApp.removeExtraWhitespace(string);
        expect(test).to.equal('a b c d e f g');
        done();
    });
});//describe: "removeExtraWhitespace"

/* UPDATES: 8-13-2015
 * Testing: Added coverage for invalid input and added coverage for proper function behavior
 * 80app: Added code block to check for invalid input
 */
describe('removeTag', function(){
    eightyApp = new EightyAppBase();
    //Testing letiables
    let string;
    let test;

    it('returns empty string when called with false/no arguments', function(done){
        test = eightyApp.removeTag();
        expect(test).to.equal('');

        //null
        string = null;
        test = eightyApp.removeTag(string);
        expect(test).to.equal('');

        //undefined
        string = undefined;
        test = eightyApp.removeTag(string);
        expect(test).to.equal('');

        //empty string
        string = '';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('');
        done();
    });

    it('does not modify text with no tags', function(done){
        string = 'abcdefghijklmnopqrstuvwxyz';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('abcdefghijklmnopqrstuvwxyz');

        string = 'the quick brown fox jumped over the lazy dog';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('the quick brown fox jumped over the lazy dog');

        string = 'x = 0. If x<1 do not modify';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('x = 0. If x<1 do not modify');

        string = 'x = 2. If x>1 do not modify';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('x = 2. If x>1 do not modify');
        done();
    });

    it('removes tags', function(done){
        string = '<div></div>';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('');

        string = '<img80 src="http://imgur.com/gallery/7eGFo3I">';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('');

        string = '<h1>test</h1>';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('test');

        string = '<h1><strong>bol</strong>d</h1>';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('bold');

        string = '<div id=\'first-product\' class="highlight box"><a href="petfooddirect.com/dog"><h1><strong>dog</strong> food</h1></a></div>';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('dog food');

        string = '<abcdefhijklmnopqrstuvwxyz>testing<zyxwvutsrqponmlkjihfedcba>';
        test = eightyApp.removeTag(string);
        expect(test).to.equal('testing');
        done();
    });
});//describe: "removeTag"

describe('replaceSpecialCharacters ', function(){
    eightyApp = new EightyAppBase();

    it('replaces special characters with alphanumeric equivalents', function(done){
        let string = 'ÄäÇçĞğİıÖöŞşÜüßàáâãèéêëěìíîïñòóôõœřùúûýÿžÀÁÂÃÈÉÊËÌÍÎÏÑÒÓÔÕÙÚÛÝŽ';
        let test = eightyApp.replaceSpecialCharacters(string);
        expect(test).to.equal('AaCcGgIiOoSsUussaaaaeeeeeiiiinoooooeruuuyyzAAAAEEEEIIIINOOOOUUUYZ');
        done();
    });

    it('returns original string if it contains no special characters', function(done){
        let string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let test = eightyApp.replaceSpecialCharacters(string);
        expect(test).to.equal('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
        done();
    });

    it('preserves non-special characters when special characters are present', function(done){
        let string = 'AÄäa CÇçc GĞğg Iİıi OÖöo SŞşs UÜüu ssßss aàaáaâaãa eèeéeêeëeěe iìiíiîiïi' +
                     ' nñn oòoóoôoõ rřr uùuúuûu yýyÿy AÀAÁAÂAÃA EÈEÉEÊEËE aÌbÍcÎdÏe qÑv -Ò;Ó:Ô\'Õ" $Ù@Ú!Û% YÝY';
        let test = eightyApp.replaceSpecialCharacters(string);

        let expectedResult = 'AAaa CCcc GGgg IIii OOoo SSss UUuu ssssss aaaaaaaaa eeeeeeeeeee iiiiiiiii' +
                             ' nnn oooooooo rrr uuuuuuu yyyyy AAAAAAAAA EEEEEEEEE aIbIcIdIe qNv -O;O:O\'O" $U@U!U% YYY';
        expect(test).to.equal(expectedResult);
        done();
    });

    it('preserves spacing', function(done){
        let string = 'a  Ä\t\tc\n\nÇ\r\r\r\ri\r\vİ\fo \t\n\r\v\fÖ';
        let test = eightyApp.replaceSpecialCharacters(string);
        expect(test).to.equal('a  A\t\tc\n\nC\r\r\r\ri\r\vI\fo \t\n\r\v\fO');
        done();
    });
});//describe: "replaceSpecialCharacters"

describe('trimAll', function() {
    eightyApp = new EightyAppBase();

    it('does not modify strings which should not be modified', function(done) {
        let array_normal = ['por ti', 'mi', 'orgullo', 'ahogo', 'en una botella'];
        let array = ['por ti', 'mi', 'orgullo', 'ahogo', 'en una botella'];
        let test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
        done();
    });

    it('handles one item with whitespae at start', function(done) {
        let array_normal = ['por ti', 'mi', 'orgullo', 'ahogo', 'en una botella'];
        let array = [' por ti', 'mi', 'orgullo', 'ahogo', 'en una botella'];
        let test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
        done();
    });

    it('handles two items with whitespae at start', function(done) {
        let array_normal = ['por ti', 'mi', 'orgullo', 'ahogo', 'en una botella'];
        let array = [' por ti', 'mi', ' orgullo', 'ahogo', 'en una botella'];
        let test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
        done();
    });

    it('handles one item with whitespae at end', function(done) {
        let array_normal = ['por ti', 'mi', 'orgullo', 'ahogo', 'en una botella'];
        let array = ['por ti ', 'mi', 'orgullo', 'ahogo', 'en una botella'];
        let test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
        done();
    });

    it('handles two items with whitespae at end', function(done) {
        let array_normal = ['por ti', 'mi', 'orgullo', 'ahogo', 'en una botella'];
        let array = ['por ti ', 'mi', 'orgullo', 'ahogo', 'en una botella '];
        let test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
        done();
    });

    it('handles one item with whitespace at end and another with it at start', function(done) {
        let array_normal = ['por ti', 'mi', 'orgullo', 'ahogo', 'en una botella'];
        let array = ['por ti ', 'mi', ' orgullo', 'ahogo', 'en una botella'];
        let test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);

        array = ['por ti ', ' mi', ' orgullo', 'ahogo ', 'en una botella'];
        test = eightyApp.trimAll(array);
        test = arraysEqual(array_normal, eightyApp.trimAll(array));
        expect(test).to.equal(true);
        done();
    });

    it ('handles empty array', function(done) {
        let array = [];
        let test = eightyApp.trimAll(array);
        expect(test).to.equal(null);
        done();
    });

    it ('handles array with an integer', function(done) {
        let array = ['test', 1];
        let test = eightyApp.trimAll(array);
        expect(test).to.equal(null);
        done();
    });

    it ('handles array with an float', function(done) {
        let array = ['test', 1.5];
        let test = eightyApp.trimAll(array);
        expect(test).to.equal(null);
        done();
    });

    it ('handles array with a boolean', function(done) {
        let array = ['test', false];
        let test = eightyApp.trimAll(array);
        expect(test).to.equal(null);
        done();
    });

    it ('handles array with a null', function(done) {
        let array = ['test', null];
        let test = eightyApp.trimAll(array);
        expect(test).to.equal(null);
        done();
    });

    it ('handles array with a undefined', function(done) {
        let array = ['test', undefined];
        let test = eightyApp.trimAll(array);
        expect(test).to.equal(null);
        done();
    });

    it ('handles nested array', function(done) {
        let array = ['test', ['dog']];
        let test = eightyApp.trimAll(array);
        expect(test).to.equal(null);
        done();
    });

    it ('handles array with object', function(done) {
        let array = ['test', { 'dog': 'rat' }];
        let test = eightyApp.trimAll(array);
        expect(test).to.equal(null);
        done();
    });

    it ('handles plain stirng', function(done) {
        let array = 'Me interesas';
        let test = eightyApp.trimAll(array);
        expect(test).to.equal(null);
        done();
    });

    it ('handles no parameters', function(done) {
        let test = eightyApp.trimAll();
        expect(test).to.equal(null);
        done();
    });

    it ('handles undefined', function(done) {
        let test = eightyApp.trimAll(undefined);
        expect(test).to.equal(null);
        done();
    });

    it ('handles an array with mixed types', function(done) {
        let test = eightyApp.trimAll([undefined, null, 1, 'hello', '   migas', 'tit  ']);
        expect(test).to.equal(null);
        done();
    });

    it ('handles null', function(done) {
        let test = eightyApp.trimAll(null);
        expect(test).to.equal(null);
        done();
    });
});
describe('stateCodeConverter', function() {
    eightyApp = new EightyAppBase();

    it('handles a true value', function(done) {
        let test = eightyApp.stateCodeConverter['Texas'];
        expect(test).to.equal('TX');
        done();
    });

    it('handles a false value', function(done) {
        let test = eightyApp.stateCodeConverter['tegucigalpa'];
        expect(test).to.equal(undefined);
        done();
    });
});

describe('countryCodeConverter', function() {
    eightyApp = new EightyAppBase();

    it('handles a true value', function(done) {
        let test = eightyApp.countryCodeConverter['Greenland'];
        expect(test).to.equal('GL');
        done();
    });

    it('handles a false value', function(done) {
        let test = eightyApp.stateCodeConverter['tegucigalpa'];
        expect(test).to.equal(undefined);
        done();
    });
});

describe('encodeSpanish', function() {
    eightyApp = new EightyAppBase();

    it('encodes spanish properly', function(done) {
        let spanishString = 'á, é, í, ó,ú,ñ,ü, Á, É, Í, Ó, Ú, Ñ, Ü';
        let encodedSpanishString = '%C3%A1, %C3%A9, %C3%AD, %C3%B3,%C3%BA,%C3%B1,%C3%BC, %C3%81, %C3%89, %C3%8D, %C3%93, %C3%9A, %C3%91, %C3%9C';
        let test = eightyApp.encodeSpanish(spanishString);
        expect(test).to.equal(encodedSpanishString);
        done();
    });
});

/* UPDATES: 07-14-2016
 * Testing: Added function to check if a paymentType is valid
 * 80app: Added code block to check for invalid input
 */
describe('processPaymentTypes', function(){
    eightyApp = new EightyAppBase();

    it('valid payment type', function(done){
        let needle = 'Master Card';
        let test = eightyApp.processPaymentTypes(needle);
        expect(test).to.equal(true);
        done();
    });

    it('invalid payment type', function(done){
        let needle = 'Other';
        let test = eightyApp.processPaymentTypes(needle);
        expect(test).to.equal(false);
        done();
    });
});

/* UPDATES: 07-14-2016
 * Testing: Added function to check if a day/day-range is valid
 * 80app: Added code block to check input and make it valid
 */
describe('processDay', function(){
    eightyApp = new EightyAppBase();

    it('is valid day', function(done){
        let needle = 'Mon';
        let test = eightyApp.processDay(needle);
        expect(test).to.equal('Monday');
        done();
    });

    it('is invalid day', function(done){
        let needle = 'Other';
        let test = eightyApp.processDay(needle);
        expect(test).to.equal(needle);
        done();
    });

    it('is valid day range', function(done){
        let needle = 'Mon - Thu';
        let test = eightyApp.processDay(needle);
        expect(test).to.equal('Monday - Thursday');
        done();
    });
});


/* UPDATES: 07-14-2016
 * Testing: Added function to check if a day/day-range is valid
 * 80app: Added code block to check input and make it valid
 */
describe('processHour', function(){
    eightyApp = new EightyAppBase();

    it('is valid hour', function(done){
        let needle = '8:00 am - 9:00 pm';
        let test = eightyApp.processHour(needle);
        expect(test).to.equal(needle);
        done();
    });

    it('am/pm with no space', function(done){
        let needle = '8:00am - 9:00pm';
        let test = eightyApp.processHour(needle);
        expect(test).to.equal('8:00 am - 9:00 pm');
        done();
    });

    it('am/pm with no space/ no minutes', function(done){
        let needle = '8am - 9pm';
        let test = eightyApp.processHour(needle);
        expect(test).to.equal('8:00 am - 9:00 pm');
        done();
    });

    it('hour with leading 0', function(done){
        let needle = '08:00am - 09:00pm';
        let test = eightyApp.processHour(needle);
        expect(test).to.equal('08:00 am - 09:00 pm');
        done();
    });

    it('hour without minutes', function(done){
        let needle = '8 am - 9 pm';
        let test = eightyApp.processHour(needle);
        expect(test).to.equal('8:00 am - 9:00 pm');
        done();
    });

    it('24 hours', function(done){
        let needle = '24 hours';
        let test = eightyApp.processHour(needle);
        expect(test).to.equal('12:00 am - 11:59 pm');
        done();
    });

    it('Invalid hours/range', function(done){
        let needle = '44:00 am - 19:00';
        let test = eightyApp.processHour(needle);
        expect(test).to.equal('manual check required');
        done();
    });
});

/* UPDATES: 10-25-2016
 * Testing: Added function to remove 80flag from URL
 * 80app: Added code block to check input and make it valid
 */
describe('strip80flagFromURL', function(){
    eightyApp = new EightyAppBase();

    it('No 80flag', function(done){
        let needle = 'http://www.80legs.com';
        let test = eightyApp.strip80flagFromURL(needle);
        expect(test).to.equal('http://www.80legs.com');
        done();
    });

    it('Basic 80flag', function(done){
        let needle = 'http://www.80legs.com?80flag=test';
        let test = eightyApp.strip80flagFromURL(needle);
        expect(test).to.equal('http://www.80legs.com');
        done();
    });

    it('Basic 80flag with slash', function(done){
        let needle = 'http://www.80legs.com/?80flag=test';
        let test = eightyApp.strip80flagFromURL(needle);
        expect(test).to.equal('http://www.80legs.com/');
        done();
    });

    it('Other parameter before 80flag', function(done){
        let needle = 'http://www.80legs.com?param=blah&80flag=test';
        let test = eightyApp.strip80flagFromURL(needle);
        expect(test).to.equal('http://www.80legs.com?param=blah');
        done();
    });

    it('Other parameter after 80flag', function(done){
        let needle = 'http://www.80legs.com?80flag=test&param=blah';
        let test = eightyApp.strip80flagFromURL(needle);
        expect(test).to.equal('http://www.80legs.com?param=blah');
        done();
    });

    it('80flag has JSON string', function(done){
        let needle = 'http://www.80legs.com?80flag={\'test\':\'hello\',\'blah\':\'yay\'}';
        let test = eightyApp.strip80flagFromURL(needle);
        expect(test).to.equal('http://www.80legs.com');
        done();
    });
});

/* UPDATES: 10-25-2016
 * Testing: Added function to map legacy DF data types to new ones
 * 80app: Added code block to check input and make it valid
 */
describe('finalizeDataType', function(){
    eightyApp = new EightyAppBase();

    it('product', function(done){
        let needle = 'product';
        let test = eightyApp.finalizeDataType(needle);
        expect(test).to.equal('product');
        done();
    });

    it('products', function(done){
        let needle = 'products';
        let test = eightyApp.finalizeDataType(needle);
        expect(test).to.equal('product');
        done();
    });

    it('location', function(done){
        let needle = 'location';
        let test = eightyApp.finalizeDataType(needle);
        expect(test).to.equal('business');
        done();
    });

    it('business', function(done){
        let needle = 'business';
        let test = eightyApp.finalizeDataType(needle);
        expect(test).to.equal('business');
        done();
    });

    it('Invalid data type', function(done){
        let needle = 'blah';
        let test = eightyApp.finalizeDataType(needle);
        expect(test).to.equal(null);
        done();
    });
});

/* UPDATES: 10-25-2016
 * Testing: Added function to convert legacy Datafiniti string values into objects with source URL attributes
 * 80app: Added code block to check input and make it valid
 */
describe('convertElementToObjectWithSourceURL', function(){
    eightyApp = new EightyAppBase();

    it('Description String', function(done){
        let needleKey = 'description';
        let needleValue = 'This is a description.';
        let needleURL = 'http://www.80legs.com';
        let test = eightyApp.convertElementToObjectWithSourceURL(needleKey, needleValue, needleURL);
        let expectedObject = { description:'This is a description.',sourceURLs:['http://www.80legs.com'] };

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });
});

/* UPDATES: 10-25-2016
 * Testing: Added function to add a sourceURL to an object
 * 80app: Added code block to check input and make it valid
 */
describe('addSourceURLToObject', function(){
    eightyApp = new EightyAppBase();

    it('SKU Object', function(done){
        let needleObject = { sku:'12345' };
        let needleURL = 'http://www.80legs.com';
        let test = eightyApp.addSourceURLToObject(needleObject, needleURL);
        let expectedObject = { sku:'12345',sourceURLs:['http://www.80legs.com'] };

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });
});

/* UPDATES: 10-25-2016
 * Testing: Added function to convert string values to list of objects with source URLs
 * 80app: Added code block to check input and make it valid
 */
describe('finalizeFieldAsListOfObjects', function(){
    eightyApp = new EightyAppBase();

    it('String', function(done){
        let needleOldFieldName = 'description';
        let needleOldFieldValue = 'This is a description.';
        let needleURL = 'http://www.80legs.com';
        let test = eightyApp.finalizeFieldAsListOfObjects(needleOldFieldName, needleOldFieldValue, needleURL);
        let expectedObject = [{ description:'This is a description.',sourceURLs:['http://www.80legs.com'] }];

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });

    it('Array of objects', function(done){
        let needleOldFieldName = 'description';
        let needleOldFieldValue = [{ description:'This is a description.' },{ description:'This is a second description.' }];
        let needleURL = 'http://www.80legs.com';
        let test = eightyApp.finalizeFieldAsListOfObjects(needleOldFieldName, needleOldFieldValue, needleURL);
        let expectedObject = [{ description:'This is a description.',sourceURLs:['http://www.80legs.com'] },{ description:'This is a second description.',sourceURLs:['http://www.80legs.com'] }];

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });

    it('Single Object', function(done){
        let needleOldFieldName = 'description';
        let needleOldFieldValue = { description: 'This is a description.' };
        let needleURL = 'http://www.80legs.com';
        let test = eightyApp.finalizeFieldAsListOfObjects(needleOldFieldName, needleOldFieldValue, needleURL);
        let expectedObject = [{ description:'This is a description.',sourceURLs:['http://www.80legs.com'] }];

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });
});

/* UPDATES: 10-25-2016
 * Testing: Added function to finalize a record so it can be imported into Datafiniti.  Handles a lot of legacy mapping.
 * 80app: Added code block to check input and make it valid
 */
describe('finalizeRecord', function(){
    eightyApp = new EightyAppBase();

    it('empty result', function(done) {
        let needleResult = {};
        let needleURL = 'http://www.80leges.com';
        let test = eightyApp.finalizeRecord(needleResult,needleURL);
        let expectedObject = {};

        expect(test).to.deep.equal(expectedObject);
        done();
    });

    it('array of records', function(done){
        let needleResult = [
            {
                'dataType': 'product',
                'brand': 'Bradford White',
                'name': 'Ef Series Ultra High Efficiency Models',
                'manufacturerNumber': 'EF-60T-125E-3N'
            },
            {
                'dataType': 'product',
                'brand': 'Bradford White',
                'name': 'Ef Series Ultra High Efficiency Models',
                'manufacturerNumber': 'EF-60T-150E-3N'
            },
            {
                'dataType': 'product',
                'brand': 'Bradford White',
                'name': 'Ef Series Ultra High Efficiency Models',
                'manufacturerNumber': 'EF-60T-199E-3N'
            }
        ];

        let needleURL = 'http://www.bradfordwhite.com/sites/default/files/manuals-spec-sheets/commercial/gas-natural/';
        let test = eightyApp.finalizeRecord(needleResult, needleURL);

        let expectedObject = [
            {
                'dataType': 'product',
                'brand': 'Bradford White',
                'name': 'Ef Series Ultra High Efficiency Models',
                'manufacturerNumber': 'EF-60T-125E-3N',
                'sourceURLs': [
                    'http://www.bradfordwhite.com/sites/default/files/manuals-spec-sheets/commercial/gas-natural/'
                ]
            },
            {
                'dataType': 'product',
                'brand': 'Bradford White',
                'name': 'Ef Series Ultra High Efficiency Models',
                'manufacturerNumber': 'EF-60T-150E-3N',
                'sourceURLs': [
                    'http://www.bradfordwhite.com/sites/default/files/manuals-spec-sheets/commercial/gas-natural/'
                ]
            },
            {
                'dataType': 'product',
                'brand': 'Bradford White',
                'name': 'Ef Series Ultra High Efficiency Models',
                'manufacturerNumber': 'EF-60T-199E-3N',
                'sourceURLs': [
                    'http://www.bradfordwhite.com/sites/default/files/manuals-spec-sheets/commercial/gas-natural/'
                ]
            }
        ];
        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });

    it('tripadvisor', function(done){
        let needleResult = {
            'dataType': 'business',
            'name': 'Auberge Buena Vista',
            'address': '5.7 Avenue Kwame n\'Krhuma, 09 BP 1247 Ouaga 09',
            'city': 'Ouagadougou',
            'postalCode': '01',
            'country': 'Burkina Faso',
            'province': 'Ouagadougou',
            'descriptions': 'Auberge Buena Vista, Ouagadougou: See reviews, articles, and 2 photos of Auberge Buena Vista, ranked No.12 on TripAdvisor among 12 attractions in Ouagadougou.',
            'lat': '12.36213',
            'long': '-1.517894',
            'email': 'contact@auberge-buenavistaouaga.com',
            'images': [
                'https://media-cdn.tripadvisor.com/media/photo-t/03/be/c0/2a/auberge-buena-vista.jpg'
            ],
            'phones': [
                '0022670027554'
            ],
            'rooms': [
                {
                    'roomType': 'Double Room',
                    'amountMax': 124,
                    'amountMin': 124,
                    'capacity': 1,
                    'currency': 'USD',
                    'dateSeen': '2017-08-07T23:26:50Z'
                },
                {
                    'roomType':'Single Room',
                    'amountMax': 124,
                    'amountMin': 124,
                    'capacity': 1,
                    'currency': 'USD',
                    'dateSeen': '2017-08-07T23:26:50Z'
                }
            ]
        };
        let needleURL = 'http://tripadvisor.com/Attraction_Review-g293769-d1806977-Reviews-Auberge_Buena_Vista-Ouagadougou_Centre_Region.html';
        let test = eightyApp.finalizeRecord(needleResult, needleURL);

        let currentDate = eightyApp.getNearestDateMinute();
        let expectedObject = {
            'dataType': 'business',
            'name': 'Auberge Buena Vista',
            'address': '5.7 Avenue Kwame n\'Krhuma, 09 BP 1247 Ouaga 09',
            'city': 'Ouagadougou',
            'postalCode': '01',
            'country': 'Burkina Faso',
            'province': 'Ouagadougou',
            'descriptions': [
                {
                    'sourceURLs': ['http://tripadvisor.com/Attraction_Review-g293769-d1806977-Reviews-Auberge_Buena_Vista-Ouagadougou_Centre_Region.html'],
                    'value': 'Auberge Buena Vista, Ouagadougou: See reviews, articles, and 2 photos of Auberge Buena Vista, ranked No.12 on TripAdvisor among 12 attractions in Ouagadougou.',
                    'dateSeen': [currentDate]
                }
            ],
            'lat': '12.36213',
            'long': '-1.517894',
            'email': 'contact@auberge-buenavistaouaga.com',
            'images': [
                'https://media-cdn.tripadvisor.com/media/photo-t/03/be/c0/2a/auberge-buena-vista.jpg'
            ],
            'phones': [
                '0022670027554'
            ],
            'rooms':[
                {
                    'roomType': 'Double Room',
                    'amountMax': 124,
                    'amountMin': 124,
                    'capacity': 1,
                    'currency': 'USD',
                    'dateSeen': [currentDate]
                },
                {
                    'roomType':'Single Room',
                    'amountMax': 124,
                    'amountMin': 124,
                    'capacity': 1,
                    'currency': 'USD',
                    'dateSeen': [currentDate]
                }
            ],
            'sourceURLs': [
                'http://tripadvisor.com/Attraction_Review-g293769-d1806977-Reviews-Auberge_Buena_Vista-Ouagadougou_Centre_Region.html'
            ]
        };
        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });

    it('Quantity Record', function(done){
        let needleResult = {
            dataType: 'product',
            quantity: 5
        };
        let needleURL = 'http://www.80legs.com';
        let test = eightyApp.finalizeRecord(needleResult, needleURL);

        let currentDate = eightyApp.getNearestDateMinute();
        let expectedObject = {
            dataType: 'product',
            quantities: [
                {
                    sourceURLs: ['http://www.80legs.com'],
                    value: 5,
                    dateSeen: [currentDate]
                }
            ],
            sourceURLs: [
                'http://www.80legs.com'
            ]
        };
        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });

    it('Record 1', function(done){
        let needleResult = {
            dataType: 'product',
            description: 'This is a description.',
            prices: [
                {
                    price: 'USD 5.00',
                    color: 'blue'
                }
            ],
            sku: '12345',
            upc: '0000000000',
            ean: '0000000000'
        };
        let needleURL = 'http://www.80legs.com';
        let test = eightyApp.finalizeRecord(needleResult, needleURL);

        let currentDate = eightyApp.getNearestDateMinute();
        let expectedObject = {
            dataType: 'product',
            prices: [
                {
                    color: 'blue',
                    sourceURLs: ['http://www.80legs.com'],
                    currency: 'USD',
                    amountMin: 5.00,
                    amountMax: 5.00,
                    dateSeen: [currentDate]
                }
            ],
            upc: [
                '0000000000'
            ],
            ean: [
                '0000000000'
            ],
            descriptions: [
                {
                    sourceURLs: ['http://www.80legs.com'],
                    value: 'This is a description.',
                    dateSeen: [currentDate]
                }
            ],
            skus: [
                {
                    sourceURLs: ['http://www.80legs.com'],
                    value: '12345'
                }
            ],
            sourceURLs: [
                'http://www.80legs.com'
            ]
        };

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });

    it('Finalize without UPC', function(done){
        let currentDate = eightyApp.getNearestDateMinute();

        let needleResult = {
            dataType: 'product',
            brand: 'Dell',
            manufacturerNumber: '94TR3',
            name: 'Dell 94TR3 Power Companion (12"',
            reviews: [
                {
                    title: 'Can\'t imagine life without it',
                    date: '2017-07-07T00:00:00.000Z',
                    dateSeen: currentDate,
                    username: 'ByJ. Mcginnis',
                    rating: 5.0,
                    text: 'Was not sure I was going to need this but now I can\'t imagine life without it. Fantastic product and great life so far. Charges quickly and can charge my laptop completely while maintaining power and still have enough juice to change my phone.'
                }
            ]
        };
        let needleURL = 'https://www.amazon.com/product-reviews/B01BX263WW/ref=cm_cr_arp_d_show_all?&reviewerType=all_reviews&ie=UTF8&pageNumber=0&showViewpoints=1&sortBy=bySubmissionDateDescending&80flag=%22brand%22:%22Dell%22,%22manufacturerNumber%22:%2294TR3%22,%22name%22:%22Dell 94TR3 Power Companion (12%22';
        let test = eightyApp.finalizeRecord(needleResult, needleURL);

        let expectedObject = {
            dataType: 'product',
            brand: 'Dell',
            manufacturerNumber: '94TR3',
            name: 'Dell 94TR3 Power Companion (12"',
            reviews: [
                {
                    title: 'Can\'t imagine life without it',
                    date: '2017-07-07T00:00:00.000Z',
                    dateSeen: [currentDate],
                    username: 'ByJ. Mcginnis',
                    rating: 5.0,
                    text: 'Was not sure I was going to need this but now I can\'t imagine life without it. Fantastic product and great life so far. Charges quickly and can charge my laptop completely while maintaining power and still have enough juice to change my phone.',
                    sourceURLs: ['https://www.amazon.com/product-reviews/B01BX263WW/ref=cm_cr_arp_d_show_all?&reviewerType=all_reviews&ie=UTF8&pageNumber=0&showViewpoints=1&sortBy=bySubmissionDateDescending']
                }
            ],
            sourceURLs: [
                'https://www.amazon.com/product-reviews/B01BX263WW/ref=cm_cr_arp_d_show_all?&reviewerType=all_reviews&ie=UTF8&pageNumber=0&showViewpoints=1&sortBy=bySubmissionDateDescending'
            ]
        };

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });

    it('Perfectly Fine Record', function(done){
        let currentDate = eightyApp.getNearestDateMinute();

        let needleResult = {
            dataType: 'product',
            prices: [
                {
                    color: 'blue',
                    sourceURLs: ['http://www.80legs.com'],
                    currency: 'USD',
                    amountMin: 5.00,
                    amountMax: 5.00,
                    dateSeen: [currentDate]
                }
            ],
            upc: [
                '0000000000'
            ],
            ean: [
                '0000000000'
            ],
            descriptions: [
                {
                    sourceURLs: ['http://www.80legs.com'],
                    value: 'This is a description.',
                    dateSeen: [currentDate]
                }
            ],
            skus: [
                {
                    sourceURLs: ['http://www.80legs.com'],
                    value: '12345'
                }
            ],
            sourceURLs: [
                'http://www.80legs.com'
            ]
        };
        let needleURL = 'http://www.80legs.com';
        let test = eightyApp.finalizeRecord(needleResult, needleURL);

        let expectedObject = {
            dataType: 'product',
            prices: [
                {
                    color: 'blue',
                    sourceURLs: ['http://www.80legs.com'],
                    currency: 'USD',
                    amountMin: 5.00,
                    amountMax: 5.00,
                    dateSeen: [currentDate]
                }
            ],
            upc: [
                '0000000000'
            ],
            ean: [
                '0000000000'
            ],
            descriptions: [
                {
                    sourceURLs: ['http://www.80legs.com'],
                    value: 'This is a description.',
                    dateSeen: [currentDate]
                }
            ],
            skus: [
                {
                    sourceURLs: ['http://www.80legs.com'],
                    value: '12345'
                }
            ],
            sourceURLs: [
                'http://www.80legs.com'
            ]
        };

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });

    it('Legacy Property Record', function(done){
        let needleResult = {
            dataType: 'properties',
            address: '123 Anywhere St',
            availableDates: [
                {
                    endDate: '2017-07-07T00:00:00.000Z',
                    startDate: '2017-07-07T00:00:00.000Z'
                }
            ],
            brokers: [
                {
                    agent: 'Sam I am',
                    company: 'Company',
                    emails: [
                        'sam@company.com'
                    ],
                    phones: [
                        '212-212-2122'
                    ],
                    websites: [
                        'http://www.company.com'
                    ]
                }
            ],
            buildingName: 'Thunderdome',
            city: 'Austin',
            country: 'US',
            deposits: [
                {
                    amount: 123.00,
                    currency: 'USD'
                }
            ],
            descriptions: [
                {
                    value: 'Fight for your life at the Thunderdome'
                }
            ],
            features: [
                {
                    key: 'Horde size',
                    value: 'Very large'
                }
            ],
            fees: [
                {
                    amountMin: 2.00,
                    amountMax: 3.00,
                    currency: 'USD',
                    type: 'obnoxious fee'
                }
            ],
            floorSizeValue: 2000,
            floorSizeUnit: 'Sq. ft.',
            hours: [
                {
                    day: 'monday',
                    hour: '8 am to 5 pm'
                }
            ],
            languagesSpoken: [
                'English'
            ],
            latitude: 23.123,
            leasingTerms: [
                {
                    value: 'Defeat Tina Turner'
                }
            ],
            listingName: 'Beautiful dome full of gladiatorial combat',
            longitude: 23.123,
            lotSizeValue: 100.00,
            lotSizeUnit: 'sq. meters',
            managedBy: [
                {
                    value: 'the queen'
                }
            ],
            mlsNumber: '1234',
            nearbySchools: [
                {
                    assigned: 'TRUE',
                    address: 'the wasteland',
                    city: 'Austin',
                    country: 'US',
                    distanceValue: 1.0,
                    distanceUnit: 'miles',
                    faxes: [
                        '123-123-1234'
                    ],
                    gradeLevels: [
                        'all ages welcome'
                    ],
                    name: 'Kiddie Kombat',
                    phonese: [
                        '123-123-1234'
                    ],
                    postalCode: '78701',
                    province: 'TX'
                }
            ],
            neighborhoods: [
                'Reverbating Walnuts'
            ],
            numBathroom: 0,
            numBedroom: 50,
            numFloor: 1,
            numPeople: 1000,
            numRoom: 10,
            numUnit: 2,
            parking: [
                'All cars will be stolen'
            ],
            paymentTypes: [
                'All money will be stolen'
            ],
            people: [
                {
                    email: 'max@iammax.com',
                    name: 'Max',
                    phone: '123-123-1234',
                    title: 'Mad'
                }
            ],
            petPolicy: 'No dogs allowed',
            phones: [
                '123-123-1234'
            ],
            postalCode: '78701',
            prices: [
                {
                    amountMin: 100.00,
                    amountMax: 1000.00,
                    availability: 'available',
                    comment: 'die die die',
                    currency: 'USD',
                    dateValidStart: '2017-07-07T00:00:00.000Z',
                    dateValidEnd: '2017-07-07T00:00:00.000Z',
                    isSale: 'FALSE',
                    minStay: 'forever',
                    period: '1 week',
                    pricePerSquareFoot: 10.00
                }
            ],
            propertyTaxes: [
                {
                    amount: 5.00,
                    currency: 'USD'
                }
            ],
            province: 'TX',
            reviews: [
                {
                    date: '2017-07-07T00:00:00.000Z',
                    dateAdded: '2017-07-07T00:00:00.000Z',
                    doRecommend: 'TRUE',
                    rating: 5,
                    text: 'Saw a lovely beheading the other day.',
                    title: 'Aw yeah',
                    userCity: 'Houston',
                    username: 'MetalLord2000',
                    userProvince: 'TX'
                }
            ],
            rules: [
                'Only super cool dudes allowed'
            ],
            statuses: [
                {
                    isUnderContract: 'true',
                    type: 'For Sale'
                }
            ],
            taxID: '12345',
            unavailableDates: [
                {
                    endDate: '2017-07-07T00:00:00.000Z',
                    startDate: '2017-07-07T00:00:00.000Z'
                }
            ],
            websiteIDs: [
                'domain.com-123'
            ]
        };
        let needleURL = 'http://www.80legs.com';
        let test = eightyApp.finalizeRecord(needleResult, needleURL);

        let currentDate = eightyApp.getNearestDateMinute();
        let expectedObject = {
            dataType: 'property',
            address: '123 Anywhere St',
            availableDates: [
                {
                    endDate: '2017-07-07T00:00:00.000Z',
                    startDate: '2017-07-07T00:00:00.000Z',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            brokers: [
                {
                    agent: 'Sam I am',
                    company: 'Company',
                    emails: [
                        'sam@company.com'
                    ],
                    phones: [
                        '212-212-2122'
                    ],
                    websites: [
                        'http://www.company.com'
                    ],
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            buildingName: 'Thunderdome',
            city: 'Austin',
            country: 'US',
            deposits: [
                {
                    amount: 123.00,
                    currency: 'USD',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            descriptions: [
                {
                    value: 'Fight for your life at the Thunderdome',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            features: [
                {
                    key: 'Horde size',
                    value: [
                        'Very large'
                    ]
                }
            ],
            fees: [
                {
                    amountMin: 2.00,
                    amountMax: 3.00,
                    currency: 'USD',
                    type: 'obnoxious fee',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            floorSizeValue: 2000,
            floorSizeUnit: 'Sq. ft.',
            hours: [
                {
                    day: 'monday',
                    hour: '8 am to 5 pm'
                }
            ],
            languagesSpoken: [
                'English'
            ],
            latitude: 23.123,
            leasingTerms: [
                {
                    value: 'Defeat Tina Turner',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            listingName: 'Beautiful dome full of gladiatorial combat',
            longitude: 23.123,
            lotSizeValue: 100.00,
            lotSizeUnit: 'sq. meters',
            managedBy: [
                {
                    value: 'the queen',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            mlsNumber: '1234',
            nearbySchools: [
                {
                    assigned: 'TRUE',
                    address: 'the wasteland',
                    city: 'Austin',
                    country: 'US',
                    distanceValue: 1.0,
                    distanceUnit: 'miles',
                    faxes: [
                        '123-123-1234'
                    ],
                    gradeLevels: [
                        'all ages welcome'
                    ],
                    name: 'Kiddie Kombat',
                    phonese: [
                        '123-123-1234'
                    ],
                    postalCode: '78701',
                    province: 'TX',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            neighborhoods: [
                'Reverbating Walnuts'
            ],
            numBathroom: 0,
            numBedroom: 50,
            numFloor: 1,
            numPeople: 1000,
            numRoom: 10,
            numUnit: 2,
            parking: [
                'All cars will be stolen'
            ],
            paymentTypes: [
                'All money will be stolen'
            ],
            people: [
                {
                    email: 'max@iammax.com',
                    name: 'Max',
                    phone: '123-123-1234',
                    title: 'Mad',
                    dateSeen: [currentDate]
                }
            ],
            petPolicy: 'No dogs allowed',
            phones: [
                '123-123-1234'
            ],
            postalCode: '78701',
            prices: [
                {
                    amountMin: 100.00,
                    amountMax: 1000.00,
                    availability: 'available',
                    comment: 'die die die',
                    currency: 'USD',
                    dateValidStart: '2017-07-07T00:00:00.000Z',
                    dateValidEnd: '2017-07-07T00:00:00.000Z',
                    isSale: 'FALSE',
                    minStay: 'forever',
                    period: '1 week',
                    pricePerSquareFoot: 10.00,
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            propertyTaxes: [
                {
                    amount: 5.00,
                    currency: 'USD',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            province: 'TX',
            reviews: [
                {
                    date: '2017-07-07T00:00:00.000Z',
                    dateAdded: '2017-07-07T00:00:00.000Z',
                    doRecommend: 'TRUE',
                    rating: 5,
                    text: 'Saw a lovely beheading the other day.',
                    title: 'Aw yeah',
                    userCity: 'Houston',
                    username: 'MetalLord2000',
                    userProvince: 'TX',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            rules: [
                'Only super cool dudes allowed'
            ],
            statuses: [
                {
                    isUnderContract: 'true',
                    type: 'For Sale',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            taxID: '12345',
            unavailableDates: [
                {
                    endDate: '2017-07-07T00:00:00.000Z',
                    startDate: '2017-07-07T00:00:00.000Z',
                    sourceURLs: [
                        'http://www.80legs.com'
                    ],
                    dateSeen: [currentDate]
                }
            ],
            websiteIDs: [
                'domain.com-123'
            ],
            sourceURLs: [
                'http://www.80legs.com'
            ]
        };

        expect(JSON.stringify(test)).to.equal(JSON.stringify(expectedObject));
        done();
    });
});

/* UPDATES: 10-20-2016
 * Added function to convert alphanumeric phone numbers to numeric ones
 */
describe('convertAlphanumericPhone', function() {
    eightyApp = new EightyAppBase();

    it('does not harm numeric phone', function(done) {
        let phone = '8303794354';
        let test = eightyApp.convertAlphanumericPhone(phone);
        expect(test).to.equal(phone);
        done();
    });

    it('properly converts alphanumeric number without hyphens', function(done) {
        let phone = '18007777EBT';
        let test = eightyApp.convertAlphanumericPhone(phone);
        expect(test).to.equal('18007777328');
        done();
    });

    it('properly converts alphanumeric number with hyphens', function(done) {
        let phone = '770-382-GOLD';
        let test = eightyApp.convertAlphanumericPhone(phone);
        expect(test).to.equal('770-382-4653');
        done();
    });
});