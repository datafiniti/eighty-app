/**
 * builderApps.js contains the apps that will be used in the 80appBuilder on the new 80legs Portal.
 * These apps are programatically added to the base EightyApp (EightyApp.js) and can be called from it.
 * While these apps can be called by users as well, we should not advertise this as they are far from being
 * 100% polished.
 *
 * Tests for these apps reside in test/builderApps.test.js
 */

const urlLib = require('url')
const $ = require('cheerio')

/**
  * getExternal for use in the portals 80appBuilder
  * Gets all of the links for domains outside of the domain we
  * are currently crawling.
  */
const getExternal = function (links, $html, url) {
  if (!url) {
    return links;
  }
  let currentUrl = url;

    // Use a set so we don't duplicate any links
  let externalLinks = new Set()

  //check for http:// or https:// in current link and remove if present
  if(currentUrl.indexOf('https://') > -1 || currentUrl.indexOf('http://') > -1 || currentUrl.indexOf('www.') > -1){
    currentUrl = currentUrl.replace('https://', '');
    currentUrl = currentUrl.replace('http://', '');
    currentUrl = currentUrl.replace('www.', '');
  }

  //get current url domain
  let domain = currentUrl.match(/^\w+.\w+/);
  
  //get each link on page
  $html.find('a').each((i, link) => {
    let href = $(link).attr('href')
    let moddedhref = href;
    
    if(href && !(/^\//.test(href))){

      if(href.indexOf('https://') > -1 || href.indexOf('http://') > -1 || href.indexOf('www.') > -1){
        moddedhref = moddedhref.replace('https://', '');
        moddedhref = moddedhref.replace('http://', '');
        moddedhref = moddedhref.replace('www.', '');
      }

      let linkDomain = String(moddedhref.match(/^\w+.\w+/));

      if (linkDomain && (linkDomain != domain && linkDomain.indexOf(domain) == -1 && domain.indexOf(linkDomain) == -1)) {
        externalLinks.add(href)
        console.log(typeof(domain) + " : " + typeof(linkDomain));
        console.log((link != domain) + '  :  ' + (link == domain));       
        console.log(linkDomain + ' : ' + domain + ' : ' + href)
      }
    }
  })

    // Convert the set of links to an array so it's easier to work with
  externalLinks = Array.from(externalLinks)

  if (externalLinks.length > 0) {
    links.push(...externalLinks)
  }

  return links
}

/*
  * getFullTextContent for use in the 80appBuilder
  * Returns the full text content of a webpage, if any.
  */
const getFullTextContent = function (resultsObject, $html) {
  let fullTextContent = $html.find('body').text()
  if (fullTextContent === null) fullTextContent = $html.filter('body').text()

  if (fullTextContent) {
    resultsObject['fullTextContent'] = fullTextContent
  }

  return fullTextContent
}

/*
  * getPageTitle for use in the 80appBuilder
  * Gets the title of the webpage (if any)
  */
const getPageTitle = function (resultsObject, $html) {
  let pageTitle = $html.find('title').text()
  if (pageTitle === null) pageTitle = $html.filter('title').text()

  if (pageTitle) {
    resultsObject['pageTitle'] = pageTitle
  }

  return pageTitle
}

/*
  * getMetaDescription for use in the 80appBuilder
  * Gets the content of meta description tag
  */
const getMetaDescription = function (resultsObject, $html) {
  let metaDescription = $html.find('meta[name="description"]').attr('content')
  if (metaDescription === null) metaDescription = $html.filter('meta[name="description"]').attr('content')

  if (metaDescription) {
    resultsObject['metaDescription'] = metaDescription
  }

  return metaDescription
}

/**
     * fullPageContent for use in the 80legs Portal App Builder
     * Adds the full page content to the results object
     */
const fullPageContent = function (resultsObject, $html) {
  const content = new String($html).toString()

  if (content) {
    resultsObject['fullPageContent'] = content
  }

  return content
}

/**
   * crawlInternalLinks for use in the 80legs Portal App Builder
   * Grabs all 'a' tags, and checks the host for each url. If the host
   * matches the host of the url we are crawling, we collect it
   */
const crawlInternal = function (links, $html, url) {
  if (!url) {
    return links;
  }
  let currentUrl = url;

    // Use a set so we don't duplicate any links
  let internalLinks = new Set()

  //check for http:// or https:// in current link and remove if present
  if(currentUrl.indexOf('https://') > -1 || currentUrl.indexOf('http://') > -1 || currentUrl.indexOf('www.') > -1){
    currentUrl = currentUrl.replace('https://', '');
    currentUrl = currentUrl.replace('http://', '');
    currentUrl = currentUrl.replace('www.', '');
  }

  //get current url domain
  let domain = currentUrl.match(/^\w+.\w+/);

  //get each link on page
  $html.find('a').each((i, link) => {
    let href = $(link).attr('href')
    
    if(/^\//.test(href)){
      href = domain+href;
      internalLinks.add(href);
    }
    else if (href){

      if(href.indexOf('https://') > -1 || href.indexOf('http://') > -1 || href.indexOf('www.') > -1){
        href = href.replace('https://', '');
        href = href.replace('http://', '');
        href = href.replace('www.', '');
      }

      let linkDomain = href.match(/^\w+.\w+/);

      if (linkDomain && (linkDomain === domain)) {
        internalLinks.add(href)
      }
    }
  })

    // Convert the set of links to an array so it's easier to work with
  internalLinks = Array.from(internalLinks)

  if (internalLinks.length > 0) {
    links.push(...internalLinks)
  }

  return links
}

/**
   * keywordCount for use in the 80legs Portal App Builder
   * Gets the entire text of a page, ignoring <script>, <style>, and <link> tags.
   * Splits the text on whitespace, and adds up how many time any given words appear.
   */
const keywordCount = function (resultsObject, $html) {
  const keywordCount = {}

  const content = $('script, link, style', $html).remove().end().text()

  content.split(/\s+/).forEach(keyword => {
    if (keywordCount[keyword]) {
      keywordCount[keyword] = keywordCount[keyword] + 1
    } else {
      keywordCount[keyword] = 1
    }
  })

  resultsObject['keywordCount'] = keywordCount

  return keywordCount
}

/**
 * @param {Object} resultsObject
 * @param {jQueryObject} $html
 * @param {string} url
 * Collects all the urls inside all img (img80)tags
 */
const collectImages = (resultsObject, $html, url) => {
  let images = []
  $html.find('img80').each((i, obj) => {
    let url = $(obj).attr('src')
    images.push(url)
  })
  resultsObject.images = images

  return images
}

/**
 * @param {Object} object
 * @param {jQueryObject} $html
 * @param {string} url
 * Collects all the pdfs inside the main document
 */
const collectPDFs = (object, $html, url) => {
  let pdfs = []
  $html.find('a[href$=".pdf"]').each((i, obj) => {
    let url = $(obj).attr('href')
    pdfs.push(url)
  })
  if (pdfs.length > 1) {
    object.PDFs = pdfs
  }

  return pdfs
}

/**
 * @param {Object} object
 * @param {jQueryObject} $html
 * @param {string} url
 * Collects all the documents inside the main document
 */
const collectDocs = (object, $html, url) => {
  const extensions = ['doc', 'docx', 'csv', 'xls', 'xlsx', 'ppt', 'pdf', 'pptx', 'md', 'txt', 'odf', 'tex', 'dvi']
  let documents = []
  extensions.forEach(e => {
    $html.find(`a[href$=".${e}"]`).each((i, obj) => {
      let url = $(obj).attr('href')
      documents.push(url)
    })
  })

  if (documents.length > 1) {
    object.documents = documents
  }

  return documents
}

/**
 * @param {Object} resultsObject
 * @param {jQueryObject} $html
 * @param {string} url
 * Gets all the emails on the page by a regular expression
 * if the returned array is not null and has at least 1 result
 * it gets inserted on the resultObject
 */
const getEmailAddresses = (resultsObject, $html, url) => {
  let emails = $html.text().match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
  if (emails && emails.length > 0) {
    resultsObject.emails = emails
  }

  return emails
}

/**
 * @param {Object} resultsObject
 * @param {jQueryObject} $html
 * @param {string} url
 * Get all the telephone numbers
 * Additional formats can be added
 */
const getPhoneNumbers = (object, $html, url) => {
  let formats = '(999)999-9999|999-999-9999|9999999999|9999-9999'
  let regex = RegExp('(' +
             formats
               .replace(/([\(\)])/g, '\\$1')
               .replace(/9/g, '\\d') +
             ')', 'g')
  let phones = $html.text().match(regex)

  if (phones && phones.length > 0) {
    object.phoneNumbers = phones
  }

  return phones
}

/**
 *
 * @param {Object} resultsObject
 * @param {jQueryObject} $html
 * @param {string} url
 * Looks for tracking information software
 * currently only checks for Google Analytics
 */
const getTrackingInfo = (object, $html, url) => {
  const trackingDictionary = {
    'ga_action': 'Google Analytics',
    'googleanalytics': 'Google Analytics',
    'googleanalytics_get_script': 'Google Analytics'
  }
  const presentTrackingInfo = new Set()

  Object.keys(trackingDictionary).forEach(e => {
    $html.find('script').each((i, obj) => {
      if ($(obj).text().match(e)) {
        presentTrackingInfo.add(trackingDictionary[e])
      }
    })
  })

  if (presentTrackingInfo.size > 1) {
    object.trackingInfo = [...presentTrackingInfo]
  }

  return [...presentTrackingInfo]
}

module.exports = {
  getFullTextContent,
  getMetaDescription,
  getEmailAddresses,
  getPhoneNumbers,
  getTrackingInfo,
  fullPageContent,
  crawlInternal,
  collectImages,
  getPageTitle,
  collectPDFs,
  collectDocs,
  getExternal,
  keywordCount
}
