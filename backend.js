/**
 * forceScopes: Forces only the required OAuth scopes.
 * Run this function once to have Google Apps Script generate the required scopes.
 */
function forceScopes() {
  Logger.log("User Email: " + Session.getActiveUser().getEmail());
  PropertiesService.getUserProperties(); // Forces script.storage, userinfo.email, userinfo.profile
}

/**
 * doGet: Serves the HTML page of the Web App and passes the authenticated user's email.
 */
function doGet() {
  var template = HtmlService.createTemplateFromFile("Index");
  template.userEmail = Session.getActiveUser().getEmail();
  return template.evaluate().setTitle("Meta Campaign Manager Pro");
}

/* ==================================================
   DATA MANAGEMENT FUNCTIONS
   Stores user-specific data using PropertiesService.
================================================== */
function getUserData(propertyName) {
  var userProps = PropertiesService.getUserProperties();
  var data = userProps.getProperty(propertyName);
  return data ? JSON.parse(data) : [];
}

function saveUserData(propertyName, data) {
  PropertiesService.getUserProperties().setProperty(propertyName, JSON.stringify(data));
}

/* ==================================================
   CAMPAIGNS MANAGEMENT
================================================== */
function getMetaCampaigns() {
  return getUserData("metaCampaigns");
}

function saveMetaCampaigns(campaigns) {
  saveUserData("metaCampaigns", campaigns);
}

function addMetaCampaign(campaign) {
  var campaigns = getMetaCampaigns();
  campaign["Campaign ID"] = new Date().getTime();
  campaign["User"] = Session.getActiveUser().getEmail();
  campaigns.push(campaign);
  saveMetaCampaigns(campaigns);
  return "Campaign added successfully.";
}

function updateMetaCampaign(campaignId, updatedFields) {
  return updateData("metaCampaigns", "Campaign ID", campaignId, updatedFields);
}

function deleteMetaCampaign(campaignId) {
  return deleteData("metaCampaigns", "Campaign ID", campaignId);
}

/* ==================================================
   AD SETS MANAGEMENT
================================================== */
function getMetaAdSets() {
  return getUserData("metaAdSets");
}

function saveMetaAdSets(adSets) {
  saveUserData("metaAdSets", adSets);
}

function addMetaAdSet(adSet) {
  var adSets = getMetaAdSets();
  adSet["Ad Set ID"] = new Date().getTime();
  adSet["User"] = Session.getActiveUser().getEmail();
  adSets.push(adSet);
  saveMetaAdSets(adSets);
  return "Ad Set added successfully.";
}

function updateMetaAdSet(adSetId, updatedFields) {
  return updateData("metaAdSets", "Ad Set ID", adSetId, updatedFields);
}

function deleteMetaAdSet(adSetId) {
  return deleteData("metaAdSets", "Ad Set ID", adSetId);
}

/* ==================================================
   ADS MANAGEMENT
================================================== */
function getMetaAds() {
  return getUserData("metaAds");
}

function saveMetaAds(ads) {
  saveUserData("metaAds", ads);
}

function addMetaAd(ad) {
  var ads = getMetaAds();
  ad["Ad ID"] = new Date().getTime();
  ad["User"] = Session.getActiveUser().getEmail();
  ads.push(ad);
  saveMetaAds(ads);
  return "Ad added successfully.";
}

function updateMetaAd(adId, updatedFields) {
  return updateData("metaAds", "Ad ID", adId, updatedFields);
}

function deleteMetaAd(adId) {
  return deleteData("metaAds", "Ad ID", adId);
}

/* ==================================================
   CSV IMPORT: ROUTE DATA TO THE CORRECT LEVEL
================================================== */
function processCSVUpload(csvData, type) {
  var lines = csvData.split("\n");
  if (lines.length < 2) return "The CSV file is empty or invalid.";
  var headers = lines[0].split(",");
  var items = [];
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var values = line.split(",");
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      item[headers[j].trim()] = values[j] ? values[j].trim() : "";
    }
    item["User"] = Session.getActiveUser().getEmail();
    if (type === "campaigns" && !item["Campaign ID"]) {
      item["Campaign ID"] = new Date().getTime() + i;
    } else if (type === "adsets" && !item["Ad Set ID"]) {
      item["Ad Set ID"] = new Date().getTime() + i;
    } else if (type === "ads" && !item["Ad ID"]) {
      item["Ad ID"] = new Date().getTime() + i;
    }
    items.push(item);
  }
  var message = "";
  if (type === "campaigns") {
    var campaigns = getMetaCampaigns();
    campaigns = campaigns.concat(items);
    saveMetaCampaigns(campaigns);
    message = "CSV file for Campaigns imported successfully.";
  } else if (type === "adsets") {
    var adSets = getMetaAdSets();
    adSets = adSets.concat(items);
    saveMetaAdSets(adSets);
    message = "CSV file for Ad Sets imported successfully.";
  } else if (type === "ads") {
    var ads = getMetaAds();
    ads = ads.concat(items);
    saveMetaAds(ads);
    message = "CSV file for Ads imported successfully.";
  } else {
    message = "Invalid CSV type.";
  }
  return message;
}

/* ==================================================
   DATA ANALYSIS & KPI EVALUATION
================================================== */
function analyzeData() {
  var analysis = {};
  var campaigns = getMetaCampaigns();
  if (campaigns.length > 0) {
    var totalBudget = 0, totalConversions = 0, totalClicks = 0;
    var sumCTR = 0, sumCPA = 0, sumROAS = 0;
    var countCTR = 0, countCPA = 0, countROAS = 0;
    campaigns.forEach(function(c) {
      var budget = parseFloat(c["Budget Spent (€)"]) || 0;
      var conversions = parseFloat(c["Conversions"]) || 0;
      var clicks = parseFloat(c["Clicks"]) || 0;
      totalBudget += budget;
      totalConversions += conversions;
      totalClicks += clicks;
      var ctr = parseFloat(c["CTR (%)"]);
      if (!isNaN(ctr)) { sumCTR += ctr; countCTR++; }
      var cpa = parseFloat(c["CPA (Cost per Acquisition)"]);
      if (isNaN(cpa) && budget > 0 && conversions > 0) { cpa = budget / conversions; }
      if (!isNaN(cpa)) { sumCPA += cpa; countCPA++; }
      var roas = parseFloat(c["ROAS"]);
      if (!isNaN(roas)) { sumROAS += roas; countROAS++; }
    });
    var avgCTR = countCTR ? (sumCTR / countCTR).toFixed(2) : "N/A";
    var avgCPA = countCPA ? (sumCPA / countCPA).toFixed(2) : "N/A";
    var avgROAS = countROAS ? (sumROAS / countROAS).toFixed(2) : "N/A";
    var convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "N/A";
    var campaignAdvice = "";
    campaignAdvice += (avgCTR !== "N/A" && parseFloat(avgCTR) < 2)
      ? "Your CTR is below the expected threshold. Consider testing new creative assets and refining your targeting. "
      : "Your CTR is within an acceptable range. ";
    campaignAdvice += (avgCPA !== "N/A" && parseFloat(avgCPA) > 20)
      ? "Your CPA is high. Review your bidding strategy and conversion funnel to optimize costs. "
      : "Your CPA is under control. ";
    campaignAdvice += (avgROAS !== "N/A" && parseFloat(avgROAS) < 2)
      ? "Your ROAS is below the desired level. Consider remarketing strategies or adjusting your budget allocation. "
      : "Your ROAS is satisfactory. ";
    campaignAdvice += (convRate !== "N/A" && parseFloat(convRate) < 5)
      ? "The conversion rate is low; optimize your landing pages and call-to-action elements. "
      : "The conversion rate is good. ";
    analysis.campaigns = {
      totalBudget: totalBudget.toFixed(2),
      totalConversions: totalConversions,
      totalClicks: totalClicks,
      averageCTR: avgCTR,
      averageCPA: avgCPA,
      averageROAS: avgROAS,
      conversionRate: convRate,
      suggestion: campaignAdvice
    };
  }
  var adSets = getMetaAdSets();
  if (adSets.length > 0) {
    var totalBudget = 0;
    var totalDays = 0;
    adSets.forEach(function(set) {
      var budget = parseFloat(set["Budget"]) || 0;
      totalBudget += budget;
      var startDate = new Date(set["Start Date"]);
      var endDate = new Date(set["End Date"]);
      if (startDate && endDate && endDate > startDate) {
        totalDays += (endDate - startDate) / (1000 * 3600 * 24);
      }
    });
    var avgBudget = adSets.length ? (totalBudget / adSets.length).toFixed(2) : "N/A";
    var avgDailyBudget = totalDays > 0 ? (totalBudget / totalDays).toFixed(2) : "N/A";
    var adSetsAdvice = "";
    adSetsAdvice += (avgBudget !== "N/A" && parseFloat(avgBudget) < 100)
      ? "Your ad set budgets are low; consider increasing them for better reach. "
      : "Ad set budgets appear adequate. ";
    adSetsAdvice += "Average Daily Budget: €" + avgDailyBudget;
    analysis.adSets = {
      totalBudget: totalBudget.toFixed(2),
      averageBudget: avgBudget,
      averageDailyBudget: avgDailyBudget,
      suggestion: adSetsAdvice
    };
  }
  var ads = getMetaAds();
  if (ads.length > 0) {
    var totalClicks = 0, totalConversions = 0;
    var sumCTR = 0, sumEngagement = 0;
    var countCTR = 0, countEngagement = 0;
    ads.forEach(function(ad) {
      var clicks = parseFloat(ad["Clicks"]) || 0;
      var conversions = parseFloat(ad["Conversions"]) || 0;
      totalClicks += clicks;
      totalConversions += conversions;
      var ctr = parseFloat(ad["CTR (%)"]);
      if (!isNaN(ctr)) { sumCTR += ctr; countCTR++; }
      var engagement = parseFloat(ad["Engagement Rate (%)"]);
      if (!isNaN(engagement)) { sumEngagement += engagement; countEngagement++; }
    });
    var avgCTR = countCTR ? (sumCTR / countCTR).toFixed(2) : "N/A";
    var avgEngagement = countEngagement ? (sumEngagement / countEngagement).toFixed(2) : "N/A";
    var convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "N/A";
    var adsAdvice = "";
    adsAdvice += (avgCTR !== "N/A" && parseFloat(avgCTR) < 1)
      ? "Ad CTR is very low; experiment with different ad formats and messaging. "
      : "Ad CTR is acceptable. ";
    adsAdvice += (avgEngagement !== "N/A" && parseFloat(avgEngagement) < 2)
      ? "Engagement is low; try more interactive or engaging content. "
      : "Engagement levels are satisfactory. ";
    adsAdvice += "Conversion Rate: " + convRate + "%.";
    analysis.ads = {
      totalClicks: totalClicks,
      totalConversions: totalConversions,
      averageCTR: avgCTR,
      averageEngagement: avgEngagement,
      conversionRate: convRate,
      suggestion: adsAdvice
    };
  }
  return analysis;
}

/* ==================================================
   AUTOMATION & TRIGGER FUNCTIONS
================================================== */
function automatedAnalysis() {
  return analyzeData();
}

function createAnalysisTrigger() {
  ScriptApp.newTrigger("automatedAnalysis")
    .timeBased()
    .everyHours(1)
    .create();
  return "Automated analysis trigger created (runs every hour).";
}

/* ==================================================
   HELPER FUNCTIONS
   These functions handle loading, saving, updating, and deleting user-specific data.
================================================== */
function updateData(propertyName, idKey, idValue, updatedFields) {
  var data = getUserData(propertyName);
  var item = data.find(function(d) { return d[idKey] == idValue; });
  if (!item) return idKey + " not found.";
  Object.assign(item, updatedFields);
  saveUserData(propertyName, data);
  return idKey + " updated successfully.";
}

function deleteData(propertyName, idKey, idValue) {
  var data = getUserData(propertyName).filter(function(d) { return d[idKey] != idValue; });
  saveUserData(propertyName, data);
  return idKey + " deleted.";
}

/* ==================================================
   CAMPAIGN SCRIPTS
   Returns formatted campaign scripts as an HTML string with separate boxes.
================================================== */
function getCampaignScripts() {
  var html = "";
  // Script 1
  html += '<div class="campaign-script-box">';
  html += '<h5>1. “Dream Home Finder” (Lead Magnet)</h5>';
  html += '<p><strong>Ad Copy:</strong><br>';
  html += '🏡 Your dream home is waiting for you! 🔑<br>';
  html += 'Get access to an exclusive list of homes for sale in [City]. Don’t miss out!<br>';
  html += '📩 Click below to download the list for FREE!<br>';
  html += '👉 [CTA: Download Now]</p>';
  html += '<p><strong>Headline:</strong> 🚪 Find Your Dream Home Today!</p>';
  html += '<p><strong>CTA:</strong> Download</p>';
  html += '<p><strong>Creative:</strong> Professional photos of cozy, modern homes.</p>';
  html += '</div>';
  // Script 2
  html += '<div class="campaign-script-box">';
  html += '<h5>2. “Sell Fast, Sell Smart” (Sellers Lead Gen)</h5>';
  html += '<p><strong>Ad Copy:</strong><br>';
  html += '🏠 Thinking of selling your home? Get the best price FAST!<br>';
  html += 'Our proven strategy sells homes in less than 30 days.<br>';
  html += '💰 Find out what your home is worth for FREE!<br>';
  html += '👉 Click below for your free home valuation!</p>';
  html += '<p><strong>Headline:</strong> 💰 Sell Your Home for Top Dollar!</p>';
  html += '<p><strong>CTA:</strong> Get Your Free Valuation</p>';
  html += '<p><strong>Creative:</strong> Before-and-after images of sold homes.</p>';
  html += '</div>';
  // Script 3
  html += '<div class="campaign-script-box">';
  html += '<h5>3. “Just Listed” (Direct Sale)</h5>';
  html += '<p><strong>Ad Copy:</strong><br>';
  html += '🏡 HOT NEW LISTING in [Neighborhood]!<br>';
  html += '✨ 3 Beds | 2 Baths | [Square Feet]<br>';
  html += '💰 Price: [Insert Price]<br>';
  html += '📍 [City, State]<br>';
  html += '📲 Schedule a private tour now!</p>';
  html += '<p><strong>Headline:</strong> 🔥 This Home Won’t Last Long!</p>';
  html += '<p><strong>CTA:</strong> Book a Tour</p>';
  html += '<p><strong>Creative:</strong> Carousel with professional photos of the home.</p>';
  html += '</div>';
  // Script 4
  html += '<div class="campaign-script-box">';
  html += '<h5>4. “Open House Invitation” (Event Promotion)</h5>';
  html += '<p><strong>Ad Copy:</strong><br>';
  html += '🚪 EXCLUSIVE OPEN HOUSE! See this stunning home before it’s gone!<br>';
  html += '📅 Date: [Insert Date] | 📍 Location: [Insert Address]<br>';
  html += '🎟 Limited spots available! Click below to RSVP.</p>';
  html += '<p><strong>Headline:</strong> 🔑 Tour Your Future Home!</p>';
  html += '<p><strong>CTA:</strong> RSVP Now</p>';
  html += '<p><strong>Creative:</strong> Video walkthrough of the home.</p>';
  html += '</div>';
  // Script 5
  html += '<div class="campaign-script-box">';
  html += '<h5>5. “New Construction Homes” (Lead Magnet)</h5>';
  html += '<p><strong>Ad Copy:</strong><br>';
  html += '🚧 Searching for a brand-new home in [City]?<br>';
  html += 'Get early access to exclusive new construction properties!<br>';
  html += '📩 Click below to download our New Home Guide!</p>';
  html += '<p><strong>Headline:</strong> 🏗️ Get Access to the Best New Homes!</p>';
  html += '<p><strong>CTA:</strong> Download</p>';
  html += '<p><strong>Creative:</strong> Infographic with home blueprints and renderings.</p>';
  html += '</div>';
  // (Continua con gli altri script come da lista completa...)
  return html;
}

/* ==================================================
   AI GENERATION OF CAMPAIGN SCRIPTS
   Uses the OpenAI API (ChatGPT) to generate a campaign script based on user parameters.
================================================== */
function generateCampaignScript(campaignType, city, budget, agentName) {
  var prompt = "Generate a Facebook Ads campaign script for a real estate agent targeting the American market. " +
               "Campaign Type: " + campaignType + ". " +
               "City: " + city + ". " +
               "Budget: " + budget + " USD. " +
               "Agent Name: " + agentName + ". " +
               "Include a detailed ad copy, headline, CTA, and creative description.";
  
  var apiKey = "YOUR_OPENAI_API_KEY"; // Sostituisci con la tua API Key di OpenAI
  var url = "https://api.openai.com/v1/chat/completions";
  var payload = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert in real estate marketing and Facebook Ads." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 500
  };
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var jsonResponse = JSON.parse(response.getContentText());
    return jsonResponse.choices[0].message.content;
  } catch (e) {
    return "Error: " + e.toString();
  }
}

/* ==================================================
   AI GENERATION OF VIDEO CAMPAIGN SCRIPTS
   Uses the OpenAI API (ChatGPT) to generate a video campaign script based on user parameters.
================================================== */
function generateVideoCampaignScript(videoType, city, agentName, tone) {
  var prompt = "Generate a detailed video campaign script for a real estate agent on Facebook Ads targeting the American market. " +
               "Video Type: " + videoType + ". " +
               "City: " + city + ". " +
               "Agent Name: " + agentName + ". " +
               "Tone: " + tone + ". " +
               "Include a storyboard idea, engaging video ad copy, voiceover text, and a clear call-to-action.";
  
  var apiKey = "sk-proj-_Lu0pr02RAquUgWuC169aTiUbV4F5zS_FTCecPzISMi9v6Qij8ieD7lSDEX0VWcINl6z1V-oehT3BlbkFJQlMGJrstSuaD0SPEDkQeCCCqLhV4ETrtrg6RlY4J61zWgF-_TqDUMeMy_WTICZSSEGgA"; // Sostituisci con la tua API Key di OpenAI
  var url = "https://api.openai.com/v1/chat/completions";
  var payload = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert in video marketing and Facebook Ads for real estate." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 600
  };
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var jsonResponse = JSON.parse(response.getContentText());
    return jsonResponse.choices[0].message.content;
  } catch (e) {
    return "Error: " + e.toString();
  }
}
