// ==UserScript==
// @name PaperJudge
// @description Label paper with its CCF Level
// @namespace https://github.com/AsterNighT/Userscripts
// @match https://dblp.org/search?q=*
// @license MIT
// @version 1.0.0
// @author AsterNighT
// @run-at document-idle
// @require file://D:\work\Userscripts\scripts\paperjudge\paperjudge.user.js
// @require https://raw.githubusercontent.com/evanplaice/jquery-csv/main/src/jquery.csv.js
// ==/UserScript==

'use strict'

let databaseURL = "https://raw.githubusercontent.com/AsterNighT/Userscripts/master/scripts/paperjudge/database.csv";

let catagoryMapping = ["", "计算机体系结构/并行与分布计算/存储系统", "计算机网络", "网络与信息安全", "软件工程/系统软件/程序设计语言", "数据库/数据挖掘/内容检索", "计算机科学理论", "计算机图形学与多媒体", "人工智能", "人机交互与普适计算", "交叉/综合/新兴"]

let database = {};

async function initialize() {
    let response = await fetch(databaseURL);
    if (!response.ok) {
        console.log("There's been trouble loading the database from github.")
        return false;
    }
    let csv = await response.text();
    database = $.csv.toObjects(csv);
    // {
    //     key: string,
    //     level: 'A'|'B'|'C',
    //     type: 'Journal'|'Meeting',
    //     category:'1'-'10'
    // }
    console.log(database);
    return true;
}

function searchInDatabase(site) {
    for (let item of database) {
        if (site.includes(item.key)) {
            return getDescriptorFromItem(item);
        }
    }
    // We do not know this site!
    console.log(`Unknown site: ${site}`);
    return "Unknown";
}

function getDescriptorFromItem(item) {
    return `${item.level} - ${item.type} - ${catagoryMapping[parseInt(item.category)]}`
}

function appendDescriptor() {
    let targets = document.querySelectorAll("li > cite")
    console.log(`A total of ${targets.length} targets found`);
    for (let target of targets) {
        handleNode(target);
    }
}

function handleNode(target) {
    let hyperlinks = target.getElementsByTagName('a');
    let candidate = hyperlinks[hyperlinks.length - 1];
    // Whatever it is, we do not want it.
    if (candidate.firstChild.getAttribute('itemprop') !== "isPartOf") return;
    let site = candidate.getAttribute("href");
    let descriptor = searchInDatabase(site);
    let node = document.createElement('div');
    node.innerHTML = `${descriptor}`;
    target.appendChild(node);
}

var MutationObserver = window.MutationObserver;
var myObserver = new MutationObserver(mutationHandler);
var obsConfig = {
    childList: true,
    subtree: true,
    attributes: true,
};

function mutationHandler(mutationRecords) {
    mutationRecords.forEach(function (mutation) {
        handleMutation(mutation.target);
    });
}

function handleMutation(node) {
    //-- Only process element nodes
    if (node.tagName === "LI") {
        handleNode(node.getElementsByTagName('cite')[0]);
    }
}

(async function main() {
    let ok = await initialize();
    if (ok) {
        while (document.readyState !== "complete") {
            await new Promise(r => setTimeout(r, 1000));
        }
        appendDescriptor();
        myObserver.observe(document, obsConfig);
    }
    console.log("PaperJudge Loaded");
})()