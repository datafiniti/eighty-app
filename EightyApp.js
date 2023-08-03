/****************************
STANDARDS FOR ADDING NEW FUNCTIONS
1. Consult with the Data Quality Manager before beginning modification of base 80app.
2. Write tests. Tests should cover handling all bad input (undefined/null/""), handling an expected pattern of input, and predictable edge cases.
    Help for writing tests can be found in the 'test' directory
3. Consult with a member of the Ops team after method and test completion. They will approve/deny pushing your changes to live.

STANDARDS FOR WRITING NEW FUNCTIONS
1. Functions should have simple, meaningful names. Preferably without abbreviations.
2. Functions should not be domain specific. Functions should be applicable to common concepts, not one specific website.
3. Make sure your code is legible and consistently formatted. It is preferred to have code with better readability than fast, but illegible, code.
4. When false input is received (undefined/null/"") functions should usually return null, except for functions that explicitly return text.
   Functions that return text should instead return an empty string upon receiving bad input.
****************************/

const builderApps = require('./builderApps');
const _ = require('lodash');

var EightyAppBase = function() {
    var authStatus;

    var initialize = function() {
        authStatus = false;
    };

    /*
     * Outputs a String to the 80appTester's console box
     * @param {String} msg The string to output
     */
    this.say = function(msg) {
        process.send({
            message: msg.toString()
        });
    };

    this.version = '3.0';

    // Add all 80appBuilder apps to the base 80app
    // These should only be used from within the 80appBuilder on the
    // new version of the 80legs Portal
    Object.keys(builderApps).forEach(app => {
        this[app] = builderApps[app];
    });

    /**
     * Default function Crawl Health Monitor will use to determine health of 80app execution.
     * @param {Object} crawlJob 
     * @param {Object} crawlResult
     * @param {String} url
     * @param {Object} extras
     */
    this.checkHealth = function(crawlJob, crawlResult, url, extras) {

        // Handle 80app function executions (parseLinks/processDocument) only once per crawlJob
        let pageTypes = {
            processDocument: true,
            parseLinks: true
        };
        if (crawlResult.processDocument.error) {
            pageTypes.processDocument = false;
        }
        if (crawlResult.parseLinks.error) {
            pageTypes.parseLinks = false;
        }

        const dataType = extras.dataType;

        // If both dataType and crawl result(s) are available scan through them and test for target fields
        if (crawlResult.processDocument.result && crawlResult.processDocument.result.data && dataType) {

            // Standardize data to array of result(s)
            let results = crawlResult.processDocument.result.data;
            results = Array.isArray(results) ? results : [results];

            // Check for target fields based on dataType.
            for (let data of results) {
        
                switch (dataType) {
                    case 'business':
                        if (data.latitude && data.longitude) {
                            if (pageTypes.latlong) {
                                pageTypes.latlong.push(true);
                            } else {
                                pageTypes.latlong = [true];
                            }
                        }
                        break;
                    case 'product':
                        if (data.upc) {
                            if (pageTypes.upc) {
                                pageTypes.upc.push(true);
                            } else {
                                pageTypes.upc = [true];
                            }
                        }
                        break;
                    case 'property':
                        if (data.mostRecentStatus && data.mostRecentStatus.length) {
                            if (pageTypes.mostRecentStatus) {
                                pageTypes.mostRecentStatus.push(true);
                            } else {
                                pageTypes.mostRecentStatus = [true];
                            }
                        }
                }
            }
        }

        return { pageTypes };
    }

    /**
     * Converts 24 hour time to the corresponding 12 hour time string
     * @param {String} time24
     */
    this.convert24HourTime = function(time24){
        if (!time24) {
            return '';
        }

        let splitTime = time24.split(':');
        let hours = splitTime[0].replace(/[^\d]/g, '') || '';
        let minutes = splitTime[1] && splitTime[1].replace(/[^\d]/g, '');
        minutes = minutes ? ':' + minutes : '';

        let meridiem = '';

        if (!hours || hours > 24 || hours < 0) {
            // Invalid hours
            return '';
        }
        if (hours >= 12) {
            hours %= 12;
            meridiem = ' PM';
        } else {
            meridiem =  ' AM';
        }

        if (hours == 0) {
            hours = 12;
            meridiem  = ' AM';
        }

        return hours + minutes + meridiem;
    };

    /**
     * Returns the corresponding number expression (as a string) for the attribute passed in. Number expressions
     * may conditionally have decimals, or dashes to delineate ranges or negative numbers. '1-2', '.4-0.54', and '-.6'
     * are all valid number expressions
     * getNumberValue('I have 2 dogs and 3 cats', /dogs/) => 2
     * getNumberValue('I have 2 dogs and 3 cats', /cats/) => 3
     * see test.js for more examples
     * @param {String} str the String to parse for numbers
     * @param {RegExp} attribute the pattern to match within the string
     */
    this.getNumberValue = function(str, attribute) {
        if (!str) {
            // Only want to work with valid strings
            return '';
        }
        if (!(attribute instanceof RegExp)) {
            // Want attribute to be a regexp only
            throw new TypeError('invalid regular expression ' + attribute.toString());
        }

        // Really scary regex that matches the closest number expression before and the closest number expression after the first occurance of attribute
        let regex = new RegExp('(\\d*\\.??\\d*-??\\d*\\.??\\d+)?[^\\d]*?' + attribute.source + '[^\\d]*(\\d*\\.??\\d*-??\\d*\\.??\\d+)?', 'g' + attribute.flags);

        // So that we can properly collect numbers with commas
        str = str.replace(/(\d),(\d)/g, ($0, $1, $2) => { return $1 + $2; });

        let match = regex.exec(str);

        if (!match || !match[1] && !match[2]) {
            // If attribute pattern wasn't matched in str
            return '';
        }
        if (!match[1]) {
            // If only number expression after attribute was found
            return match[2];
        }
        if (!match[2]) {
            // If only number expression before attribute was found
            return match[1];
        }

        // Return the number expression match that was closest to the attribute match

        let matchInfo = str.match(attribute);
        let matchLength = matchInfo[0].length;

        let matchStartIndex = matchInfo.index;
        let matchEndIndex = matchStartIndex + matchLength;

        // Distance from first match to attribute match
        let distOne = Math.abs(matchStartIndex - (str.match(match[1]).index + match[1].length));

        // Distance from the second match to attribute match
        let distTwo = Math.abs((regex.lastIndex - match[2].length) - matchEndIndex);

        let matches = {
            [distOne] : match[1],
            [distTwo] : match[2]
        };

        return matches[Math.min(distOne, distTwo)];
    };

    /**
     * Removes all duplicates from each array field in data object. Duplicates are defined by
     * @param comparator. If no comparator function is specified, defaults to _.isEqual() with
     * case insensitive string comparisons
     * @param {Object} data
     * @param {function} comparator a function to determine object equality.
     * @return {Object} data object where all duplicates from each array field are removed. Returns null if @param data
     * is fase, not an object, or an array instance
     */
    this.removeAllDuplicates = function(data, comparator) {
        if (!data || typeof(data) !== 'object' || data instanceof Array) {
        // Only want to work with objects, not arrays
            return null;
        }

        let app = this;

        // Function for string comparison
        let stringComparator = function(obj1, obj2) {
            // If obj1 and obj2 are both strings, remove extra white space and perform case insensitive comparison
            if (typeof(obj1) === 'string' && typeof(obj2) === 'string') {
                return app.removeExtraWhitespace(obj1).toLowerCase() === app.removeExtraWhitespace(obj2).toLowerCase();
            }
        };

        if (!comparator) {
            // If comparator not defined, set default comparator to be used for deep comparison of objects
            comparator = (obj1, obj2) => { return _.isEqualWith(obj1, obj2, stringComparator); };
        }

        for (let attr in data) {
            let field = data[attr];

            if (field instanceof Array) {
            // If the field is an array, reassing it to an array where duplicates are removed
                data[attr] = _.uniqWith(field, comparator);
            }
        }

        return data;
    };

    /**
     * For each value in an array, removes any trailing whitespace
     * @param {Array} array array of strings to trim
     * @return {Array} retruns the input array with each item being trimed
     */
    this.trimAll = function(array) {
        if (array !== null && array instanceof Array && array.length > 0)
            for (var i = 0; i < array.length; i++) {
                if (typeof array[i] === 'string' || array[i] instanceof String) {
                    var tmp = this.removeExtraWhitespace(array[i]);
                    if (tmp.length>0)
                        array[i] = tmp;
                } else
                    return null;
            }
        else
            return null;
        return array;
    };

    this.processDocument = function(html, url, headers, status, jQuery) {};

    this.parseLinks = function(html, url, headers, status, jQuery) {};

    this.parseJSON = function(text) {
        return JSON.parse(text);
    };

    this.parseHtml = function(text, $) {
        text = text.replace(/(<img)\+*?/g, '<img80');
        return $(text);
    };

    this.parseXml = function(text, $) {
        text = text.replace(/(<img)\+*?/g, '<img80');
        return $(text);
    };

    this.extractHostname = function(url) {
        var hostname;
        //find & remove protocol (http, ftp, etc.) and get hostname

        if (url.indexOf('://') > -1) {
            hostname = url.split('/')[2];
        }
        else {
            hostname = url.split('/')[0];
        }

        //find & remove port number
        hostname = hostname.split(':')[0];
        //find & remove "?"
        hostname = hostname.split('?')[0];

        return hostname;
    };

    this.extractRootDomain = function(url) {
        var domain = this.extractHostname(url),
            splitArr = domain.split('.'),
            arrLen = splitArr.length;

        //extracting the root domain here
        //if there is a subdomain
        if (arrLen > 2) {
            domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
            //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
            if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
                //this is using a ccTLD
                domain = splitArr[arrLen - 3] + '.' + domain;
            }
        }
        return domain;
    };

    /**
     * Removes any special characters from a string
     * @param {String} text the string to remove special characters from
     * @return {String} the input string with any special characters removed
     */
    this.getPlainText = function(text) {
        if (!text) {
            return '';
        }

        text = text
            .replace(/[^a-z0-9\s.'-:!]/gi, '') // remove all characters not a-z, 0-9, and certain punctuation, ignoring case
            .replace(/\s{2,}/g, ' ') // replace any two whitespace characters next to each other with a single space
            .replace(/\s/g, ' '); // replace all whitespace characters (\t,\n,\r, ) with space

        // trim
        return text.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    /**
     * Removes any trailing whitespace characters and any instance of \t, \n, \r, \v, or \f
     * @param {String} text the string from which to remove extra whitespace
     * @return {String} the input string with excess whitespace removed
     */
    this.removeExtraWhitespace = function(text) {
        if (!text) {
            return '';
        }
        else {
            return text.replace(/\s{2,}/g, ' ').replace(/\s/g, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        }
    };

    /**
     * Returns whether @param obj is truthy and should be returned by an extraction function
     * @param {*} obj
     * @return {boolean} whether it is safe to operate on @param obj and whether it should be returned
     * at the end of an extraction function. Must be truthy, strings must have one non-whitespace character,
     * arrays and DOM objects must have length > 0, and generic objects must have at least one non-prototype
     * property
     */
    this.isValid = function(obj) {
        if (!obj && obj !== 0) {
            // Ensure obj is truthy (zero is the exception as it is falsey and a valid number)
            return false;
        }
        if (obj instanceof String || typeof(obj) === 'string') {
            // Ensure strings have at least one non-whitespace character
            return /[^\s]/.test(obj);
        }
        if (obj.hasOwnProperty('length')) {
            // Ensures that arrays and DOM objects aren't empty
            return obj.length > 0;
        }
        if (obj instanceof Date) {
            // Ensures that all dates are valid
            return obj.toString() !== 'Invalid Date';
        }
        if (obj instanceof Object ) {
            // Ensures that obj isn't an empty object
            return Object.keys(obj).length > 0;
        }
        if (typeof(obj) === 'number' && obj < 0) {
            return false;
        }
        return true;
    };

    /**
     * 'Deep' trims every instance of string in an object or array, or just the object itself if it is a string
     * @param {*} object element to be deep trimmed
     * @return {*}  element of same type as @param object, with all instances of string trimmed
     */
    this.trimObject = function(object) {
        let app = this;

        if (typeof object === 'string') {
            // Trim the string
            object = app.removeExtraWhitespace(object);
        } else if (object instanceof Array) {
            // Trim all strings in the array
            object = object.map(function (e) {
                return app.trimObject(e);
            });
        } else if (object instanceof Object) {
            // Trim every value in the object
            var keys = Object.keys(object);
            for (var k in keys) {
                var key = keys[k];
                var temp = object[key];
                object[key] = app.trimObject(temp);
            }
        }
        return object;
    };

    // decode unicode by inputting a selective regex and a string
    // make sure to use a global regex to replace all instances of unicode in the input string
    // code adapted from: http://stackoverflow.com/questions/7885096/how-do-i-decode-a-string-with-escaped-unicode
    this.decodeUnicode = function(regex, str) {
        if (str !== undefined) {
            var decodedString = str.replace(regex, function(match, grp) {
                return String.fromCharCode(parseInt(grp, 16));
            });
            return decodedString;
        }
    };

    /**
     * Given an object capable of generating a Date object, formats it into the format
     * yyyy-MM-ddTHH:mm:ssZ
     * @param {Object} date an object used to construct a Date object
     * @return {String} a date String formatted yyyy-MM-ddTHH:mm:ssZ
     */
    this.formatDate = function(date) {
        // yyyy-MM-ddTHH:mm:ssZ
        date = new Date(date);
        return date.getUTCFullYear() + '-' +
            (date.getUTCMonth() + 1 < 10 ? '0' + (date.getUTCMonth() + 1) : '' + (date.getUTCMonth() + 1)) + '-' +
            (date.getUTCDate() < 10 ? '0' + date.getUTCDate() : '' + date.getUTCDate()) +
            'T' +
            (date.getUTCHours() < 10 ? '0' + date.getUTCHours() : '' + date.getUTCHours()) + ':' +
            (date.getUTCMinutes() < 10 ? '0' + date.getUTCMinutes() : '' + date.getUTCMinutes()) + ':' +
            (date.getUTCSeconds() < 10 ? '0' + date.getUTCSeconds() : '' + date.getUTCSeconds()) +
            'Z';
    };

    /**
     * Removs HTML tags from a string
     * @param {String} text the text to process
     * @param {String} input string with any HTML tags removed
     */
    this.removeTag = function(text) {
        if (!text){
            return '';
        }//if: input is false, return empty string

        return text.replace(/<.*?>/g, '');
    };

    /**
     * Gets the first match from a group of regex matches
     * @param {String} text String to execute regex on
     * @param {RegExp} regexp RegExp object to run text against
     * @return {String} first match
     */
    this.getFirstMatch = function(text, regexp) {
        var matchedGroup = regexp.exec(text);
        if (matchedGroup !== null && matchedGroup !== undefined) {
            return matchedGroup[1].trim();
        }
    };

    /**
     * Appends an EightyFlag value to a link
     * @param {String} eightyValue the EightyFlag to add
     * @param {String} link the link upon which to append eightyValue
     * @return {String} the link with the EightyFlag
     */
    this.append80FlagToLink = function(eightyValue, link) {
        if (!eightyValue && !link){
            return null;
        }
        else if (!eightyValue){
            return link;
        }
        else if (!link){
            return eightyValue;
        }

        // Encode 80value to handle 80values with uri forbidden characters
        eightyValue = encodeURIComponent(eightyValue);

        var returnLink = link;
        if (link.indexOf('?') >= 0 && !/[?&]$/.test(link)) {
            returnLink = link + '&80flag=' + eightyValue;
        }
        else if (/[?&]$/.test(link)) {
            returnLink = link + '80flag=' + eightyValue;
        }
        else {
            returnLink = link + '?80flag=' + eightyValue;
        }

        return returnLink;
    };

    /**
     * Extracts the value of an EightyFlag from a link
     * @param {String} link a link with an EightyFlag
     * @return {String} the value contained in the EightyFlag on the link
     */
    this.get80Value = function(link) {

        if (link) {
            var eightyFlagIndex = link.indexOf('80flag=');
            if (eightyFlagIndex === -1){
                return null;
            }//if: no index of 80flag=

            var trimmedURL = link.substring(eightyFlagIndex);
            var endIndex = trimmedURL.indexOf('&');
            if (endIndex === -1){
                endIndex = link.length;
            }//if: endIndex was not found on an ampersand

            var eightyValue = trimmedURL.substring('80flag='.length, endIndex);
            // Decode 80value so that the return value matches parameter passed to append80FlagToLink()
            eightyValue = decodeURIComponent(eightyValue);
            return eightyValue;
        }
        return null;
    };

    // IMPORTANT Usage Note: Use makeLink on a url BEFORE appending an 80flag for review URLs. Otherwise
    // it will match on the sourceURL rather than the actual url
    this.makeLink = function(domain, href) {
        if (!domain && !href) {
            return null;
        }
        else if (!domain) {
            return href;
        }
        else if (!href) {
            return domain;
        }

        if (domain.indexOf('http://') == -1 && domain.indexOf('https://') == -1) {
            domain = 'http://' + domain;
        }

        var prefix;
        prefix = domain.indexOf('https://') !== -1 ? 'https' : 'http';
        var base = prefix == 'https' ? domain.slice(8) : domain.slice(7);


        if (base.indexOf('/') !== -1) {
            domain = prefix + '://' + base.slice(0, base.indexOf('/'));
        } else if (base.indexOf('?') !== -1) {
            domain = prefix + '://' + base.slice(0, base.indexOf('?'));
        }

        if (href.indexOf('http://') !== -1 || href.indexOf('https://') !== -1) {
            return href;
        }
        var domainCheck = prefix == 'https' ? domain.slice(8) : domain.slice(7);
        domainCheck = domainCheck.indexOf('www.') !== -1 ? domainCheck.slice(4) : domainCheck;

        if (href.indexOf(domainCheck) !== -1) {
            if (href.indexOf('http://') == -1 && href.indexOf('https://') == -1) {
                if (href.indexOf('/') == 0){
                    if (href.indexOf('//') == 0){
                        return 'http:' + href;
                    }
                    return 'http:/' + href;
                }
                return 'http://' + href;
            } else {
                return href;
            }
        } else {
            //outside domains are tagged with a double-slash in most cases
            if (href.indexOf('//') === 0){
                //must add http: - href would have been returned earlier if it had it
                return 'http:' + href;
            }
            else if (domain[domain.length - 1] == '/' && href[0] == '/') {
                domain = domain.slice(0, -1);
            } else if (domain[domain.length - 1] !== '/' && href[0] !== '/') {
                domain += '/';
            }

            return domain + href;
        }
    };

    /**
     * Converts an alphanumeric phone number to a purely numeric one
     * May be used before or after removing special characters
     * @param {String} alphanumericPhone an alphanumeric phone number
     * @return {String} the alphanumeric phone number converted to numeric form
     */
    this.convertAlphanumericPhone = function(rawPhone) {
        // If there are no alphabetic characters in the phone, don't change it
        if (!/\D/.test(rawPhone))
            return rawPhone;

        // There must be no alphabetic characters in the phone, convert them
        var convertedPhone = rawPhone.toUpperCase().split('');
        for (var i = 0; i < convertedPhone.length; i++)
            switch (convertedPhone[i]) {
            case 'A':
            case 'B':
            case 'C':
                convertedPhone.splice(i, 1, '2');
                break;
            case 'D':
            case 'E':
            case 'F':
                convertedPhone.splice(i, 1, '3');
                break;
            case 'G':
            case 'H':
            case 'I':
                convertedPhone.splice(i, 1, '4');
                break;
            case 'J':
            case 'K':
            case 'L':
                convertedPhone.splice(i, 1, '5');
                break;
            case 'M':
            case 'N':
            case 'O':
                convertedPhone.splice(i, 1, '6');
                break;
            case 'P':
            case 'Q':
            case 'R':
            case 'S':
                convertedPhone.splice(i, 1, '7');
                break;
            case 'T':
            case 'U':
            case 'V':
                convertedPhone.splice(i, 1, '8');
                break;
            case 'W':
            case 'X':
            case 'Y':
            case 'Z':
                convertedPhone.splice(i, 1, '9');
                break;
            }
        return convertedPhone.join('');
    };

    /**
     * Removes all duplicates from an array, where equality is determined by ==
     * IMPORTANT NOTE: all instances of Object are considered equal by this method, only use on primitives
     * @param arr an array containing elements of any type
     * @returns a new array where all duplicate primitives and all objects but one have been removed. Returns
     * null if @param arr is falsey
     */
    // eliminateDuplicates code borrowed from: http://dreaminginjavascript.wordpress.com/2008/08/22/eliminating-duplicates/
    this.eliminateDuplicates = function(arr) {
        if (!arr){
            return null;
        }//if: arr is falsey

        var i;
        var len = arr.length;
        var out = [];
        var obj = {};

        for (i = 0; i < len; i++) {
            if (!obj[arr[i]] && arr[i].toString().length>0) {
                obj[arr[i]] = {};
                out.push(arr[i]);
            }
        }
        return out;
    };

    //$= under $25
    //$$= $25-$40
    //$$$= $50-$55
    //$$$$= above $55
    //£ = under £15
    //££ = £15-£25
    //£££ = £30-£35
    //££££ = above £35

    //replaces dollar sign notation into dollar amounts to capture price range details
    this.getPriceRangeReplace = function(text, currency) {
        if (!text || !currency){
            return {};
        }

        var priceRangeObj = {};

        if (currency === 'USD') {
            priceRangeObj.priceRangeCurrency = 'USD';
            if (text === '$$$$') {
                priceRangeObj.priceRangeMin = 55;
            } else if (text === '$$$') {
                priceRangeObj.priceRangeMin = 40;
                priceRangeObj.priceRangeMax = 55;
            } else if (text === '$$') {
                priceRangeObj.priceRangeMin = 25;
                priceRangeObj.priceRangeMax = 40;
            } else if (text === '$') {
                priceRangeObj.priceRangeMin = 0;
                priceRangeObj.priceRangeMax = 25;
            }
        } else if (currency === 'GBP') {
            priceRangeObj.priceRangeCurrency = 'GBP';
            if (text === '££££') {
                priceRangeObj.priceRangeMin = 35;
            } else if (text === '£££') {
                priceRangeObj.priceRangeMin = 25;
                priceRangeObj.priceRangeMax = 35;
            } else if (text === '££') {
                priceRangeObj.priceRangeMin = 15;
                priceRangeObj.priceRangeMax = 25;
            } else if (text === '£') {
                priceRangeObj.priceRangeMin = 0;
                priceRangeObj.priceRangeMax = 15;
            }
        } else if (currency === 'YEN') {
            priceRangeObj.priceRangeCurrency = 'YEN';
            if (text === '¥¥¥¥') {
                priceRangeObj.priceRangeMin = 6175;
            } else if (text === '¥¥¥') {
                priceRangeObj.priceRangeMin = 4491;
                priceRangeObj.priceRangeMax = 6175;
            } else if (text === '¥¥') {
                priceRangeObj.priceRangeMin = 2807;
                priceRangeObj.priceRangeMax = 4491;
            } else if (text === '¥') {
                priceRangeObj.priceRangeMin = 0;
                priceRangeObj.priceRangeMax = 2807;
            }
        } else if (currency === 'EUR') {
            priceRangeObj.priceRangeCurrency = 'EUR';
            if (text === '€€€€') {
                priceRangeObj.priceRangeMin = 47;
            } else if (text === '€€€') {
                priceRangeObj.priceRangeMin = 34;
                priceRangeObj.priceRangeMax = 47;
            } else if (text === '€€') {
                priceRangeObj.priceRangeMin = 21;
                priceRangeObj.priceRangeMax = 34;
            } else if (text === '€') {
                priceRangeObj.priceRangeMin = 0;
                priceRangeObj.priceRangeMax = 21;
            }
        }

        return priceRangeObj;
    };

    // converts a price string into ####.##
    this.normalizePrice = function(numberString) {
        if (!numberString){
            return null;
        }//if: input numberString is falsey

        numberString = numberString.trim();
        var numberStringLength = numberString.length;

        //Check if it is using the comma as a decimal separator and change it to the dot separator
        if (numberString.substr(numberString.length-3, 3).match(/,/)){
            var last3OriginalChars = numberString.substr(numberString.length-3, 3);
            var last3NewChars = numberString.substr(numberString.length-3, 3).replace(/,/,'.');
            var re = new RegExp(last3OriginalChars+'$');
            numberString = numberString.replace(re, last3NewChars);
        }

        var numberMatch = numberString.match(/(\d+(?:[,|.]\d+)*)+/);
        if (!numberMatch)
            return null;

        if (numberMatch.length>=2){
            var number = parseFloat(numberMatch[1].replace(/,/g,''));
            if (!isNaN(number)) {
                number = number.toFixed(2);
                return numberString.replace(/(\d+(?:,|.\d+)*)+/, number);
            }
        }
        return null;
    };//function: normalizePrice


    /**
     * Converts special characters into ASCII
     * @param {String} string the string to convert to ASCII
     * @return {String} string converted to ASCII
     */
    this.replaceSpecialCharacters = function(string) {
        var stringWithSpecialCharacters = string;

        var translate = {
            'Ä': 'A',
            'ä': 'a',
            'Ç': 'C',
            'ç': 'c',
            'Ğ': 'G',
            'ğ': 'g',
            'İ': 'I',
            'ı': 'i',
            'Ö': 'O',
            'ö': 'o',
            'Ş': 'S',
            'ş': 's',
            'Ü': 'U',
            'ü': 'u',
            'ß': 'ss',
            'à': 'a',
            'á': 'a',
            'â': 'a',
            'ã': 'a',
            'è': 'e',
            'é': 'e',
            'ê': 'e',
            'ë': 'e',
            'ě': 'e',
            'œ': 'oe',
            'ì': 'i',
            'í': 'i',
            'î': 'i',
            'ï': 'i',
            'ñ': 'n',
            'ò': 'o',
            'ó': 'o',
            'ô': 'o',
            'õ': 'o',
            'ř': 'r',
            'ù': 'u',
            'ú': 'u',
            'û': 'u',
            'ý': 'y',
            'ÿ': 'y',
            'ž': 'z',
            'À': 'A',
            'Á': 'A',
            'Â': 'A',
            'Ã': 'A',
            'È': 'E',
            'É': 'E',
            'Ê': 'E',
            'Ë': 'E',
            'Ì': 'I',
            'Í': 'I',
            'Î': 'I',
            'Ï': 'I',
            'Ñ': 'N',
            'Ò': 'O',
            'Ó': 'O',
            'Ô': 'O',
            'Õ': 'O',
            'Ù': 'U',
            'Ú': 'U',
            'Û': 'U',
            'Ý': 'Y',
            'Ž': 'Z'
        };

        var replacementRegEx = new RegExp(Object.keys(translate).join('|'), 'g');

        var replacedString = stringWithSpecialCharacters.replace(replacementRegEx, function(letter) {
            return translate[letter];
        });

        return replacedString;
    };

    // Maps all American states and Canadian provinces to two letter abbreviation
    // Obselete now that addressParser is active
    this.stateCodeConverter = {
        'Alabama': 'AL',
        'Alaska': 'AK',
        'American Samoa': 'AS',
        'Arizona': 'AZ',
        'Arkansas': 'AR',
        'California': 'CA',
        'Colorado': 'CO',
        'Connecticut': 'CT',
        'Delaware': 'DE',
        'District Of Columbia': 'DC',
        'Federated States Of Micronesia': 'FM',
        'Florida': 'FL',
        'Georgia': 'GA',
        'Guam': 'GU',
        'Hawaii': 'HI',
        'Idaho': 'ID',
        'Illinois': 'IL',
        'Indiana': 'IN',
        'Iowa': 'IA',
        'Kansas': 'KS',
        'Kentucky': 'KY',
        'Louisiana': 'LA',
        'Maine': 'ME',
        'Marshall Islands': 'MH',
        'Maryland': 'MD',
        'Massachusetts': 'MA',
        'Michigan': 'MI',
        'Minnesota': 'MN',
        'Mississippi': 'MS',
        'Missouri': 'MO',
        'Montana': 'MT',
        'Nebraska': 'NE',
        'Nevada': 'NV',
        'New Hampshire': 'NH',
        'New Jersey': 'NJ',
        'New Mexico': 'NM',
        'New York': 'NY',
        'North Carolina': 'NC',
        'North Dakota': 'ND',
        'Northern Mariana Islands': 'MP',
        'Ohio': 'OH',
        'Oklahoma': 'OK',
        'Oregon': 'OR',
        'Palau': 'PW',
        'Pennsylvania': 'PA',
        'Puerto Rico': 'PR',
        'Rhode Island': 'RI',
        'South Carolina': 'SC',
        'South Dakota': 'SD',
        'Tennessee': 'TN',
        'Texas': 'TX',
        'Utah': 'UT',
        'Vermont': 'VT',
        'Virgin Islands': 'VI',
        'Virginia': 'VA',
        'Washington': 'WA',
        'West Virginia': 'WV',
        'Wisconsin': 'WI',
        'Wyoming': 'WY',
        'Slberta': 'AB',
        'British Columbia': 'BC',
        'Manitoba': 'MB',
        'New Brunswick': 'NB',
        'Newfoundland Snd Labrador': 'NL',
        'Nova Scotia': 'NS',
        'Nunavut': 'NU',
        'Ontario': 'ON',
        'Prince Edward Island': 'PE',
        'Quebec': 'QC',
        'Saskatchewan': 'SK',
        'Yukon': 'YT'
    };

    // Maps countries to two letter abbreviations
    // Obselete now that addressParser is active
    this.countryCodeConverter = {
        'Albania': 'AL',
        'Afghanistan': 'AF',
        'Andorra': 'AD',
        'Anguilla': 'AI',
        'Algeria': 'DZ',
        'American Samoa': 'AS',
        'Angola': 'AO',
        'Antigua and Barbuda': 'AG',
        'Antigua & Barbuda': 'AG',
        'Antigua': 'AG',
        'Argentina': 'AR',
        'Armenia': 'AM',
        'Aruba': 'AW',
        'Australia': 'AU',
        'Austria': 'AT',
        'Azerbaijan': 'AZ',
        'Bahamas': 'BS',
        'Bahrain': 'BH',
        'Bangladesh': 'BD',
        'Barbados': 'BB',
        'Bay Islands Honduras': 'HN',
        'Belarus': 'BY',
        'Belize': 'BZ',
        'Belgium': 'BE',
        'Benin': 'BJ',
        'Bermuda': 'BM',
        'Bhutan': 'BT',
        'Bosnia and Herzegovina': 'BA',
        'Bolivia': 'BO',
        'Bonaire': 'BQ',
        'Botswana': 'BW',
        'Bouvet Island': 'BV',
        'Brazil': 'BR',
        'British Virgin Islands': 'VG',
        'UK Virgin Islands': 'VG',
        'British Indian Ocean Territory': 'IO',
        'Brunei Darussalam': 'BN',
        'Brunei': 'BN',
        'Burkina Faso': 'BF',
        'Bulgaria': 'BG',
        'Burundi': 'BI',
        'Cambodia': 'KH',
        'Cameroon': 'CM',
        'Canada': 'CA',
        'Cape Verde': 'CV',
        'Cayman Islands': 'KY',
        'Grand Cayman': 'KY',
        'Grand Cayman Islands': 'KY',
        'Costa Rica': 'CR',
        'Curaçao': 'CW',
        'Curacao': 'CW',
        'Czech Republic': 'CZ',
        'China': 'CN',
        'Chile': 'CL',
        'Colombia': 'CO',
        'Cook Islands': 'CK',
        'Cote d\'Ivoire': 'CI',
        'Croatia': 'HR',
        'Cuba': 'CU',
        'Cyprus': 'CY',
        'Christmas Island': 'CX',
        'Cocos Islands': 'CC',
        'Central African Republic': 'CF' ,
        'Comoros': 'KM',
        'Congo': 'CG',
        'Democratic Republic of the Congo': 'CD',
        'Denmark': 'DK',
        'Djibouti': 'DJ',
        'Dominica': 'DM',
        'Dominican Republic': 'DO',
        'Ecuador': 'EC',
        'Egypt': 'EG',
        'El Salvador': 'SV',
        'England': 'GB',
        'Equatorial Guinea': 'GQ',
        'Eritrea': 'ER',
        'Estonia': 'EE',
        'Ethiopia': 'ET',
        'Falkland Islands (Malvinas)': 'FK',
        'Malvinas': 'FK',
        'Faroe Islands': 'FO',
        'Federated States of Micronesia': 'FM',
        'Figi': 'FJ',
        'Finland': 'FI',
        'France': 'FR',
        'French Guiana': 'GF',
        'French Polynesia': 'PF',
        'French Southern Territories': 'TF',
        'Gabon': 'GA',
        'Gambia': 'GM',
        'Georgia': 'GE',
        'Germany': 'DE',
        'Ghana': 'GH',
        'Gibraltar': 'GI',
        'Greece': 'GR',
        'Grenada': 'GD',
        'Greenland': 'GL',
        'Guadeloupe': 'GP',
        'Guam': 'GU',
        'Guatemala': 'GT',
        'Guernsey': 'GG',
        'Guyana': 'GY',
        'Haiti': 'HT',
        'Hong Kong': 'HK',
        'Hungary': 'HU',
        'Honduras': 'HN',
        'Heard Island and McDonald Mcdonald Islands': 'HM',
        'Holy See': 'VA',
        'Isle of Man': 'IM',
        'Iceland': 'IS',
        'Ireland': 'IE',
        'India': 'IN',
        'Indonesia': 'ID',
        'Iran': 'IR',
        'Iraq': 'IQ',
        'Israel': 'IL',
        'Italy': 'IT',
        'Jamaica': 'JM',
        'Japan': 'JP',
        'Jersey': 'JE',
        'Jordan': 'JO',
        'Kazakhstan': 'KZ',
        'Kenya': 'KE',
        'Republic of Kiribati': 'KI',
        'Kiribati': 'KI',
        'Democratic People\'s Republic of Korea': 'KP',
        'Republic of Korea': 'KR',
        'Kosovo': 'XK',
        'Kuwait': 'KW',
        'Kyrgyzstan': 'KG',
        'Laos': 'LA',
        'Latvia': 'LV',
        'Lebanon': 'LB',
        'Lesotho': 'LS',
        'Liberia': 'LR',
        'Libyia': 'LY',
        'Liechtenstein': 'LI',
        'Lithuania': 'LT',
        'Luxembourg': 'LU',
        'Macao': 'MO',
        'Macau': 'MO',
        'Madagascar': 'MG',
        'Malawi': 'MW',
        'Malaysia': 'MY',
        'Maldives': 'MV',
        'Malta': 'MT',
        'Marshall Islands': 'MH',
        'Martinique': 'MQ',
        'Mauritania': 'MR',
        'Mauritius': 'MU',
        'Mayotte': 'YT',
        'Mexico': 'MX',
        'Moldova': 'MD',
        'Monaco': 'MC',
        'Mongolia': 'MN',
        'Montserrat': 'MS',
        'Montenegro': 'ME',
        'Morocco': 'MA',
        'Mozambique': 'MZ',
        'Myanmar': 'MM',
        'Nambia': 'NA',
        'Namibia': 'NA',
        'Nauru': 'NR',
        'Nepal': 'NP',
        'Netherlands': 'NL',
        'New Caledonia': 'NC',
        'New Zealand': 'NZ',
        'Nicaragua': 'NI',
        'Nigeria': 'NG',
        'Niue': 'NU',
        'Norfolk Island': 'NF',
        'North Korea': 'KP',
        'Northern Ireland': 'GB',
        'Northern Mariana Islands': 'MP',
        'Norway': 'NO',
        'Oman': 'OM',
        'Pakistan': 'PK',
        'Panama': 'PA',
        'Papua New Guinea': 'PG',
        'Palau': 'PW',
        'Paraguay': 'PY',
        'Peru': 'PE',
        'Pitcairn': 'PN',
        'Philippines': 'PH',
        'Poland': 'PL',
        'Portugal': 'PT',
        'Puerto Rico': 'PR',
        'Qatar': 'QA',
        'Republic of Macedonia': 'MK',
        'Reunion Island': 'RE',
        'Romania': 'RO',
        'Russia': 'RU',
        'Rwanda': 'RW',
        'Saba': 'BQ',
        'Saint Barthelemy': 'BL',
        'Saint Eustacius': 'BQ',
        'Saint Kitts and Nevis': 'KN',
        'St Kitts and Nevis': 'KN',
        'St. Kitts and Nevis': 'KN',
        'St Kitts': 'KN',
        'St. Kitts': 'KN',
        'Saint Lucia': 'LC',
        'St Lucia': 'LC',
        'St. Lucia': 'LC',
        'Saint Martin-Sint Maarten': 'MF',
        'Saint Vincent and the Grenadines': 'VC',
        'St. Vincent': 'VC',
        'St Vincent': 'VC',
        'Saint Vincent': 'VC',
        'Saint Vincent & the Grenadines': 'VC',
        'San Marino': 'SM',
        'Samoa': 'WS',
        'Saudi Arabia': 'SA',
        'Scotland': 'GB',
        'Senegal': 'SN',
        'Serbia': 'RS',
        'Seychelles': 'SC',
        'Sierra Leone': 'SL',
        'Singapore': 'SG',
        'Slovakia': 'SK',
        'Slovenia': 'SI',
        'Solomon Islands': 'SB',
        'Somalia': 'SO',
        'South Georgia and the South Sandwich Islands': 'GS',
        'South Sudan': 'SS',
        'South Africa': 'ZA',
        'South Korea': 'KR',
        'Spain': 'ES',
        'Sri Lanka': 'LK',
        'Suriname': 'SR',
        'Sudan': 'SD',
        'Svalbard and Jan Mayen': 'SJ',
        'Swaziland': 'SZ',
        'Sweden': 'SE',
        'Switzerland': 'CH',
        'Syria': 'SY',
        'Taiwan': 'TW',
        'Tajikistan': 'TJ',
        'Tanzania': 'TZ',
        'Thailand': 'TH',
        'Timor-Leste': 'TL',
        'Timor Leste': 'TL',
        'Tokelau': 'TK',
        'Tonga': 'TO',
        'Trinidad and Tobago': 'TT',
        'Trinidad': 'TT',
        'Trinidad & Tobago': 'TT',
        'Tunisia': 'TN',
        'Turkey': 'TR',
        'Turkmenistan': 'TM',
        'Turks and Caicos': 'TC',
        'Turks & Caicos': 'TC',
        'Turks and caicos': 'TC',
        'Tuvalu': 'TV',
        'Uganda': 'UG',
        'Ukraine': 'UA',
        'United Arab Emirates': 'AE',
        'United Kingdom': 'GB',
        'United States': 'US',
        'United States of America': 'US',
        'United States Virgin Islands': 'VI',
        'United States Minor Outlying Islands': 'UM',
        'Uruguay': 'UY',
        'Uzbekistan': 'UZ',
        'U.S. Virgin Islands': 'VI',
        'Vanuatu': 'VU',
        'Vatican City': 'VA',
        'Venezuela': 'VE',
        'Vietnam': 'VN',
        'Wales': 'GB',
        'Wallis and Futuna': 'WF',
        'West Bank and Gaza': 'PS',
        'Yemen': 'YE',
        'Zambia': 'ZM',
        'Zimbabwe': 'ZW',
        'Aland Islands': 'AX',
        'AFG': 'AF',
        'ALB': 'AL',
        'DZA': 'DZ',
        'ASM': 'AS',
        'AND': 'AD',
        'AGO': 'AO',
        'AIA': 'AI',
        'ATA': 'AQ',
        'ATG': 'AG',
        'ARG': 'AR',
        'ARM': 'AM',
        'ABW': 'AW',
        'AUS': 'AU',
        'AUT': 'AT',
        'AZE': 'AZ',
        'BHS': 'BS',
        'BHR': 'BH',
        'BGD': 'BD',
        'BRB': 'BB',
        'BLR': 'BY',
        'BEL': 'BE',
        'BLZ': 'BZ',
        'BEN': 'BJ',
        'BMU': 'BM',
        'BTN': 'BT',
        'BOL': 'BO',
        'BIH': 'BA',
        'BWA': 'BW',
        'BVT': 'BV',
        'BRA': 'BR',
        'IOT': 'IO',
        'BRN': 'BN',
        'BGR': 'BG',
        'BFA': 'BF',
        'BDI': 'BI',
        'KHM': 'KH',
        'CMR': 'CM',
        'CAN': 'CA',
        'CPV': 'CV',
        'CYM': 'KY',
        'CAF': 'CF',
        'TCD': 'TD',
        'CHL': 'CL',
        'CHN': 'CN',
        'CXR': 'CX',
        'CCK': 'CC',
        'COL': 'CO',
        'COM': 'KM',
        'COG': 'CG',
        'COD': 'CD',
        'COK': 'CK',
        'CRI': 'CR',
        'CIV': 'CI',
        'HRV': 'HR',
        'CUB': 'CU',
        'CYP': 'CY',
        'CZE': 'CZ',
        'DNK': 'DK',
        'DJI': 'DJ',
        'DMA': 'DM',
        'DOM': 'DO',
        'TMP': 'TP',
        'ECU': 'EC',
        'EGY': 'EG',
        'SLV': 'SV',
        'GNQ': 'GQ',
        'ERI': 'ER',
        'EST': 'EE',
        'ETH': 'ET',
        'FLK': 'FK',
        'FRO': 'FO',
        'FJI': 'FJ',
        'FIN': 'FI',
        'FRA': 'FR',
        'FXX': 'FX',
        'GUF': 'GF',
        'PYF': 'PF',
        'ATF': 'TF',
        'GAB': 'GA',
        'GMB': 'GM',
        'GEO': 'GE',
        'DEU': 'DE',
        'GHA': 'GH',
        'GIB': 'GI',
        'GRC': 'GR',
        'GRL': 'GL',
        'GRD': 'GD',
        'GLP': 'GP',
        'GUM': 'GU',
        'GTM': 'GT',
        'GIN': 'GN',
        'GNB': 'GW',
        'GUY': 'GY',
        'HTI': 'HT',
        'HMD': 'HM',
        'VAT': 'VA',
        'HND': 'HN',
        'HKG': 'HK',
        'HUN': 'HU',
        'ISL': 'IS',
        'IND': 'IN',
        'IDN': 'ID',
        'IRN': 'IR',
        'IRQ': 'IQ',
        'IRL': 'IE',
        'ISR': 'IL',
        'ITA': 'IT',
        'JAM': 'JM',
        'JPN': 'JP',
        'JOR': 'JO',
        'KAZ': 'KZ',
        'KEN': 'KE',
        'KIR': 'KI',
        'PRK': 'KP',
        'KOR': 'KR',
        'KWT': 'KW',
        'KGZ': 'KG',
        'LAO': 'LA',
        'LVA': 'LV',
        'LBN': 'LB',
        'LSO': 'LS',
        'LBR': 'LR',
        'LBY': 'LY',
        'LIE': 'LI',
        'LTU': 'LT',
        'LUX': 'LU',
        'MAC': 'MO',
        'MKD': 'MK',
        'MDG': 'MG',
        'MWI': 'MW',
        'MYS': 'MY',
        'MDV': 'MV',
        'MLI': 'ML',
        'MLT': 'MT',
        'MHL': 'MH',
        'MTQ': 'MQ',
        'MRT': 'MR',
        'MUS': 'MU',
        'MYT': 'YT',
        'MEX': 'MX',
        'FSM': 'FM',
        'MDA': 'MD',
        'MCO': 'MC',
        'MNG': 'MN',
        'MNE': 'ME',
        'MSR': 'MS',
        'MAR': 'MA',
        'MOZ': 'MZ',
        'MMR': 'MM',
        'NAM': 'NA',
        'NRU': 'NR',
        'NPL': 'NP',
        'NLD': 'NL',
        'ANT': 'AN',
        'NCL': 'NC',
        'NZL': 'NZ',
        'NIC': 'NI',
        'NER': 'NE',
        'NGA': 'NG',
        'NIU': 'NU',
        'NFK': 'NF',
        'MNP': 'MP',
        'NOR': 'NO',
        'OMN': 'OM',
        'PAK': 'PK',
        'PLW': 'PW',
        'PAN': 'PA',
        'PNG': 'PG',
        'PRY': 'PY',
        'PER': 'PE',
        'PHL': 'PH',
        'PCN': 'PN',
        'POL': 'PL',
        'PRT': 'PT',
        'PRI': 'PR',
        'QAT': 'QA',
        'REU': 'RE',
        'ROM': 'RO',
        'RUS': 'RU',
        'RWA': 'RW',
        'KNA': 'KN',
        'LCA': 'LC',
        'VCT': 'VC',
        'WSM': 'WS',
        'SMR': 'SM',
        'STP': 'ST',
        'SAU': 'SA',
        'SEN': 'SN',
        'SRB': 'RS',
        'SYC': 'SC',
        'SLE': 'SL',
        'SGP': 'SG',
        'SVK': 'SK',
        'SVN': 'SI',
        'SLB': 'SB',
        'SOM': 'SO',
        'ZAF': 'ZA',
        'SSD': 'SS',
        'SGS': 'GS',
        'ESP': 'ES',
        'LKA': 'LK',
        'SHN': 'SH',
        'SPM': 'PM',
        'SDN': 'SD',
        'SUR': 'SR',
        'SJM': 'SJ',
        'SWZ': 'SZ',
        'SWE': 'SE',
        'CHE': 'CH',
        'SYR': 'SY',
        'TWN': 'TW',
        'TJK': 'TJ',
        'TZA': 'TZ',
        'THA': 'TH',
        'TGO': 'TG',
        'TKL': 'TK',
        'TON': 'TO',
        'TTO': 'TT',
        'TUN': 'TN',
        'TUR': 'TR',
        'TKM': 'TM',
        'TCA': 'TC',
        'TUV': 'TV',
        'UGA': 'UG',
        'UKR': 'UA',
        'ARE': 'AE',
        'GBR': 'GB',
        'USA': 'US',
        'UMI': 'UM',
        'URY': 'UY',
        'UZB': 'UZ',
        'VUT': 'VU',
        'VEN': 'VE',
        'VNM': 'VN',
        'VGB': 'VG',
        'VIR': 'VI',
        'WLF': 'WF',
        'ESH': 'EH',
        'YEM': 'YE',
        'ZMB': 'ZM',
        'ZWE': 'ZW',
        'Chad': 'TD',
        'São Tomé and Príncipe': 'ST',
        'Sao Tome and Principe': 'ST',
        'Mali': 'ML',
        'Niger': 'NE',
        'Guinea': 'GN',
        'Guinea-Bissau': 'GW'
    };

    // converts a given relative timeframe from the current date (when crawled) to unix
    // ex: 9 weeks ago where 9 is the timeNumber and weeks is the timeMeasurement
    // output would be a unix timestamp that can be easily imported
    this.getRelativeUnixTime = function(timeNumber, timeMeasurement) {
        var today = new Date();
        var currentDay = today.getDate();
        var currentMonth = today.getMonth();
        var currentYear = today.getFullYear();

        if (timeMeasurement == 'days' || timeMeasurement == 'day') {
            let commentDate = new Date(currentYear, currentMonth, currentDay);
            // the number of days before todays date in day of the week Month day year format which is then converted to milliseconds
            let dateNumber = -(timeNumber);
            commentDate.setDate(timeNumber);
            // divide by 1000 to get the unix timestamp in seconds
            let unixCommentDate = (commentDate / 1000);
            return unixCommentDate;
        } else if (timeMeasurement == 'weeks' || timeMeasurement == 'week') {
            // convert number of weeks into number of hours for calculation
            timeNumber = -(timeNumber * 7 * 24);
            let commentDate = new Date(currentYear, currentMonth, currentDay);
            // the number of days before todays date in day of the week Month day year format which is then converted to milliseconds
            commentDate.setHours(timeNumber);
            // console.log("COMMENT DATE: " + commentDate.toDateString);
            // divide by 1000 to get the unix timestamp in seconds
            let unixCommentDate = (commentDate / 1000);
            // console.log("COMMENT UNIX DATE: " + unixCommentDate);
            return unixCommentDate;
        } else if (timeMeasurement == 'months' || timeMeasurement == 'month') {
            // convert number of weeks into number of hours for calculation
            timeNumber = -(timeNumber * 30 * 24);
            let commentDate = new Date(currentYear, currentMonth, currentDay);
            // the number of days before todays date in day of the week Month day year format which is then converted to milliseconds
            commentDate.setHours(timeNumber);
            // console.log("COMMENT DATE: " + commentDate.toDateString);
            // divide by 1000 to get the unix timestamp in seconds
            let unixCommentDate = (commentDate / 1000);
            // console.log("COMMENT UNIX DATE: " + unixCommentDate);
            return unixCommentDate;
        } else if (timeMeasurement == 'years' || timeMeasurement == 'year') {
            // convert the number of years into the number of days for calculation
            timeNumber = -(timeNumber * 365);
            let commentDate = new Date(currentYear, currentMonth, currentDay);
            // the number of days before todays date in day of the week Month day year format which is then converted to milliseconds
            commentDate.setDate(timeNumber);
            // divide by 1000 to get unix
            let unixCommentDate = (commentDate / 1000);
            return unixCommentDate;
        }
    };

    // converts text formatting to camel case
    // EX: string input => EXAMPLE string output => Example
    // code borrorwed from: https://stackoverflow.com/questions/11933577/javascript-convert-unicode-string-to-title-case
    this.getProperCase = function(string) {
        return string.replace(/([^\s:-])([^\s:-]*)/g, function($0,$1,$2) {
            return $1.toUpperCase() + $2.toLowerCase();
        });
    };

    //***************************
    // AMAZON SPECIFIC FUNCTIONS
    // **************************

    // get ASIN Helper Function
    // returns a string ASIN
    this.getASIN = function(html, url) {
        var $html = html;
        var parentASIN = this.getFirstMatch(html, /"parent_asin":"(.*?)",/);
        var asinCheck = $html.find('#averageCustomerReviews').attr('data-asin');
        var asinCheck2 = this.getFirstMatch(url, /\/dp\/(.*?)\/ref/);
        var asinCheck3 = this.getFirstMatch(url, /\/gp\/product\/(.*?)\/ref/);
        var ASIN = '';
        if (parentASIN !== '' && parentASIN !== undefined) {
            ASIN = parentASIN;
        } else if (asinCheck !== '' && asinCheck !== undefined) {
            ASIN = asinCheck;
        } else if (asinCheck2 !== '' && asinCheck2 !== undefined) {
            ASIN = asinCheck2;
        } else if (asinCheck3 !== '' && asinCheck3 !== undefined) {
            ASIN = asinCheck3;
        } else {
            ASIN = this.getFirstMatch(url, /(?:gp\/product\/|dp\/)(.*?)(?:\/|$)/);
        }
        return ASIN;
    };

    // Encodes Spanish characters
    this.encodeSpanish = function(text) {
        var specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü',
            'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ', 'Ü'];
        var encodedChars = new Array();

        for (let i = 0; i < specialChars.length; i++)
            encodedChars.push(encodeURI(specialChars[i]));

        for (let i = 0; i < specialChars.length; i++)
            text = text.replace(new RegExp(specialChars[i], 'g'), encodedChars[i]);

        return text;
    };

    // getAttribute Helper Function
    // accepts an array of attributes to check
    // returns a string for the attribute desired
    this.getAttribute = function(html, attr) {
        var $html = html;
        var attribute = '';
        for (let i = 0; i < attr.length; i++) {
            if (attribute === '' || attribute === undefined) {
                attribute += $html.find('td.label:contains(' + attr[i] + ')').next('td.value').text().trim();
            }
            if (attribute === '' || attribute === undefined) {
                attribute += $html.find('tr:contains(' + attr[i] + ')').first().next('td').text().trim();
            }
            if (attribute === '' || attribute === undefined) {
                attribute += $html.find('li.content b:contains(' + attr[i] + ')').first().parent().find('b').remove().end().text().trim();
            }
            if (attribute === '' || attribute === undefined) {
                attribute += $html.find('li b:contains(' + attr[i] + ')').first().parent().find('b').remove().end().text().trim();
            }
            if (/Product Dimensions|UPC|Item model number/.test(attr[i]) && (attribute === '' || attribute === undefined)) {
                attribute += $html.find('span:contains(' + attr[i] + ')').first().find('span').last().text().trim();
            }
            if (attr[i] === 'Product Dimensions' && attribute !== '' && attribute !== undefined) {
                attribute = this.getFirstMatch(attribute, /(.*?)(?:;|$)/);
            }
            if (/Material|Size|dimensions/.test(attr[i]) && (attribute === '' || attribute === undefined)) {
                attribute += this.getFirstMatch($html.find('span:contains(' + attr[i] + ')').text().trim(), /attr[i]\s*?:\s*?(.*?)(?:,|$)/);
            }
            if (/Brand/.test(attr[i]) && (attribute.length === 0 || attribute === undefined)) {
                attribute += $html.find('a#brand').text().trim();
            }

        }
        return attribute.replace(/\bundefined\b/g, '');
    };

    // Setting Price Attributes Based on Domain Helper Function
    // returns an array containing price, shipping, and store information
    this.setPriceAttributes = function(domain, price, shipping) {
        var domainPrice = price;
        var domainShipping = shipping;
        var domainStore = '';
        if (domain === 'http://www.amazon.in') {
            domainPrice = this.getPlainText(domainPrice.replace(/Rs./g, '').replace(/₹/g, ''));
            if (!/^INR /.test(domainPrice)) {
                domainPrice = domainPrice.replace(/^/, 'INR ');
            }
            domainStore = 'Amazon.in';
            domainShipping = this.getPlainText(domainShipping.replace(/\+/, ''));

        } else if (domain === 'http://www.amazon.com') {
            domainPrice = this.getPlainText(domainPrice.replace(/\$/g, 'USD ').replace(/,/g, ''));
            domainStore = 'Amazon.com';
            if (domainShipping !== '' && domainShipping !== undefined) {
                domainShipping = this.getPlainText(domainShipping.replace(/\$/, 'USD ').replace(/\+/, '').replace(/Details/, ''));
                if (/\d+\.(?: |$)/.test(domainShipping)) {
                    domainShipping = domainShipping.replace(/\./, '.00');
                }
            } else {
                domainShipping = '';
            }
        }
        return [domainPrice, domainShipping, domainStore];
    };//function: setPriceAttributes


    // Helper function that fixes the day value for hours attribute that are in the form Mon/Mon - Fri/Mon-Sat
    // Expected values:
    //      Mon
    //      Mon - Fri
    // Param:
    //      value: string
    //      A string containing a Day or days range
    // Return:
    //      A string in the correct format Monday - Friday or Monday/Friday
    //      Else it will return the same value
    this.processDay = function(value){
        var weekdays = {
            'mon': 'Monday',
            'tue': 'Tuesday',
            'wed': 'Wednesday',
            'thu': 'Thursday',
            'fri': 'Friday',
            'sat': 'Saturday',
            'sun': 'Sunday'
        };

        var new_value = value;
        for (let day in weekdays) {
            var re = new RegExp(day, 'i' );
            new_value = new_value.replace(re, weekdays[day]);
        }
        return new_value;
    };

    // Helper function that fixes the hour range values
    // Expected values:
    //  9 am - 5 pm
    //  09am - 4pm
    //  24 hours
    //  08:30am - 04:00pm
    //  08am - 04pm
    //  6:00 am - 7:00 pm
    //  6:00am - 7:00pm
    // Param:
    //      value: string
    // Returns:
    //      If valid hour range, returns it, else tries to fix it, or report that a fix is needed
    this.processHour = function(value){
        function replacer(match, m1, m2, m3, m4, m5, m6){
            return m1+(m2===undefined? ':00' : m2)+' '+m3+' - '+m4+(m5===undefined? ':00' : m5)+' '+m6;
        }
        if (value.match(/(\d{1,2})(:\d{2})* *([a|p]m) *(?:to|-|through) *(\d{1,2})(:\d{2})* *([a|p]m)/i)){
            return value.replace(/(\d{1,2})(:\d{2})* *([a|p]m) *(?:to|-|through) *(\d{1,2})(:\d{2})* *([a|p]m)/i, replacer).toLowerCase();
        } else if (value.match(/24 hour/i)){
            return '12:00 am - 11:59 pm';
        } else {
            return 'manual check required';
        }
    };

    // Helper function that validates the payment type, returns true if valid payment type or false otherwise.
    // Param:
    //      type: string
    //      Value to check if it is in the valid types
    // Returns:
    //      True if valid, false otherwise.
    this.processPaymentTypes = function(type){
        var valid = ['Amex', 'American Express', 'Visa',
            'Mastercard', 'master card','Diners Club',
            'PayPal','Bitcoin', 'Cash','Check', 'Debit',
            'Debit Card','ACH','JBC','Access','Discover',
            'Carte Blanch','Novus','Gift Card','egift',
            'layaway','euromastercard','ATM'];

        var re = new RegExp(type, 'i');
        for (var elem in valid){
            if (valid[elem].match(re))
                return true;
        }

        return false;
    };

    // Return an object where object.key = value and object.sourceURL = url
    this.convertElementToObjectWithSourceURL = function (key, value, url) {

        var newObject = {};
        newObject[key] = value;
        newObject.sourceURLs = new Array();
        newObject.sourceURLs.push(this.strip80flagFromURL(url));

        return newObject;
    };

    this.addSourceURLToObject = function (obj, url) {

        obj.sourceURLs = new Array();
        obj.sourceURLs.push(this.strip80flagFromURL(url));
        return obj;
    };

    // Map any legacy data type values to new/current data type values
    this.finalizeDataType = function(dataType) {

        var newDataType = dataType;

        if (dataType === 'product') { // This isn't changing, just keeping as a placeholder

        } else if (dataType === 'products') {
            newDataType = 'product';
        } else if (dataType === 'business') { // Placeholder

        } else if (dataType === 'location') {
            newDataType = 'business';
        } else if (dataType === 'locations') {
            newDataType = 'business';
        } else if (dataType === 'property') { // This isn't changing, just keeping as a placeholder

        } else if (dataType === 'properties') {
            newDataType = 'property';
        } else {
            return newDataType = null;
        }

        return newDataType;
    };

    // A generic method for removing any paramter from a URL, taken from http://stackoverflow.com/questions/1634748/how-can-i-delete-a-query-string-parameter-in-javascript
    this.removeURLParameter = function(url, parameter) {

    //prefer to use l.search if you have a location/link object
        var urlparts = url.split('?');

        if (urlparts.length >= 2) {

            var prefix = encodeURIComponent(parameter) + '=';
            var pars = urlparts[1].split(/[&;]/g);

            //reverse iteration as may be destructive
            for (var i= pars.length; i-- > 0;) {
                //idiom for string.startsWith
                if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                    pars.splice(i, 1);
                }
            }

            url = urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
            return url;
        } else {
            return url;
        }
    };

    // Remove the 80flag parameter from a URL
    this.strip80flagFromURL = function (url) {

        var urlWithout80flag = url;
        if ((url.indexOf('?80flag=') == -1) || (url.indexOf('&80flag=') == -1))
            urlWithout80flag = this.removeURLParameter(url,'80flag');
        return urlWithout80flag;
    };


    this.getNearestDateMinute = function () {

        var coeff = 1000 * 60;
        var date = new Date();
        var rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
        return rounded;
    };

    // A method for finalizing a crawl record.  This method prepares a record for import into Datafiniti.  It updates it from any legacy settings.
    this.finalizeRecord = function(result, url) {

        // check if result is empty
        if (JSON.stringify(result) === '{}') {
            return result;
        }
        // check if result is an array of records
        else if (result.constructor === Array) {

            var finalizedResultList = [];
            for (let i = 0; i < result.length; i++) {
                finalizedResultList.push(this.finalizeRecord(result[i],url));
            }

            return finalizedResultList;

        } else {

            var app = this;
            var finalizedResult = result;

            // Add dateCrawled
            var dateCrawled = app.getNearestDateMinute();
            finalizedResult.dateCrawled = dateCrawled;

            // Make sure data type is correct
            if ('data_type' in result) {
                finalizedResult.dataType = result.data_type;
                delete finalizedResult.data_type;
            }
            finalizedResult.dataType = app.finalizeDataType(result.dataType);

            // add sourceURL to record, strip out 80flags
            var sourceURLs = [];
            sourceURLs.push(app.strip80flagFromURL(url));
            finalizedResult.sourceURLs = sourceURLs;

            return finalizedResult;
        }
    };

};//function: EightyAppBase

// The following is included to make this testable with node.js
try {
    if (module != null) {
        var $ = this.$ = '';
    }
} catch (e) {}
this.processTest = function(html, url, headers, status) {
    var app = this;
    var env = require('jsdom').env;
    env(html, function(errors, window) {
        $ = this.$ = require('jquery')(window);
        var result = app.processDocument(html, url, headers, status, $);
        console.log(result);
        var links = app.parseLinks(html, url, headers, status, $);
        console.log(links);
    });
};

try {
    // Testing
    module.exports = EightyAppBase;
} catch (e) {
    // Production
}
