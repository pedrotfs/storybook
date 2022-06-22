const express = require("express")
const router = new express.Router()
const request = require('request-promise').defaults({ encoding: 'latin1' });

var selectedRegistry = undefined;
var selectedRegistryTree = undefined;

var breadCrumb = "Tale 1 > Book 1 > Section 1";
var levelNavHome = '<ion-icon name="home-outline" class="icon-small-level-nav" onclick="moveToIndex()"></ion-icon>';
var levelNavAdd = '<ion-icon name="add-circle-outline" class="icon-small-level-nav" onclick="moveToAddRegistry()"></ion-icon>';

router.get("/", async (req, res) => {
    console.log("access root")    
    request("http://localhost:8090/actuator/health", (error, response, body) => {        
        
        breadCrumb = "Tale 1 > Book 1 > Section 1";

        let levelNavNext = '<ion-icon name="arrow-forward-outline" class="icon-small-level-nav"></ion-icon>'
        let levelNavPrevious = '<ion-icon name="arrow-back-outline" class="icon-small-level-nav"></ion-icon>';
        let levelNavTop = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav" ></ion-icon>';
        let levelNavVoid = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav-hidden" ></ion-icon>';
        let levelNavDump = '<ion-icon name="save-outline" class="icon-small-level-nav" ></ion-icon>';
        let levelNavRestore = '<ion-icon name="download-outline" class="icon-small-level-nav"></ion-icon>';
        let levelNav = {levelNavPrevious, levelNavTop, levelNavNext, levelNavHome, levelNavAdd, levelNavVoid, levelNavDump, levelNavRestore};

        if(error) {
            res.render("index", {
                connectionStatus: 'Error' + '<ion-icon name="checkmark-circle-outline" class="icon-small-health-check-fail"></ion-icon>',
                breadCrumb,
                levelNav,
                selectedRegistry,
                selectedRegistryTree
        });    
        } else {
            res.render("index", {
                connectionStatus: 'Ok' + '<ion-icon name="checkmark-circle-outline" class="icon-small-health-check-ok"></ion-icon>',
                breadCrumb,
                levelNav,
                selectedRegistry,
                selectedRegistryTree
            });
        }
        
    });   
    
})

router.get("/add-registry", async (req, res) => {
    console.log("add registry form");
    console.log(req);
    request.get("http://localhost:8090/actuator/health", async (error, response, body) => {
        let hierarchy = "Tale;Book;Chapter;Paragraph";
        let selectedHierarchy = "Tale";
        
        request.get("http://localhost:8090/util/hierarchy/", async (error, response, body)=> {
            if(error) {
                console.log("error querying registry order; using default.")
            } else {
                console.log("queried hierarchy: " + response.body);
                hierarchy = response.body;
            }

            let hierarchySplit = hierarchy.split(";");
            let hierarchyList = [];
            hierarchySplit.forEach(arrayElement => {
                hierarchyList.push(arrayElement);
            })
            console.log(hierarchyList);
            
            breadCrumb = "Add new registry > ";

            var levelNavNext = '<ion-icon name="arrow-forward-outline" class="icon-small-level-nav-hidden"></ion-icon>'
            var levelNavPrevious = '<ion-icon name="arrow-back-outline" class="icon-small-level-nav-hidden"></ion-icon>';
            var levelNavTop = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav-hidden" ></ion-icon>';
            let levelNavVoid = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav-hidden" ></ion-icon>';
            let levelNavDump = '<ion-icon name="add-circle-outline" class="icon-small-level-nav-hidden" ></ion-icon>';
            let levelNavRestore = '<ion-icon name="add-circle-outline" class="icon-small-level-nav-hidden"></ion-icon>';
            let levelNav = {levelNavPrevious, levelNavTop, levelNavNext, levelNavHome, levelNavAdd, levelNavVoid, levelNavDump, levelNavRestore};
            

            if(error) {
                res.render("addRegistry", {
                    connectionStatus: 'Error' + '<ion-icon name="checkmark-circle-outline" class="icon-small-health-check-fail"></ion-icon>',
                    breadCrumb,
                    levelNav,
                    hierarchyList,
                    selectedHierarchy,
                    selectedRegistry,
                    selectedRegistryTree
            });    
            } else {
                res.render("addRegistry", {
                    connectionStatus: 'Ok' + '<ion-icon name="checkmark-circle-outline" class="icon-small-health-check-ok"></ion-icon>',
                    breadCrumb,
                    levelNav,
                    hierarchyList,
                    selectedHierarchy,
                    selectedRegistry,
                    selectedRegistryTree
                });
            }
            
        });
    });   
    
})

router.post("/add-registry-submit", async (req, res) => {
    console.log("adding registry.");
    console.log(req.body);
    
    const requestBody = req.body;
    const formJson = {};
    formJson.title = requestBody.title;
    formJson.name = requestBody.name;
    formJson.orderIndex = requestBody.orderIndex;
    formJson.text = requestBody.text;
    formJson.imgPath = requestBody.imgPath;
    formJson.time = requestBody.time;
    formJson.type = requestBody.type;
    formJson.owner = "admin";
    formJson.id = "";
    console.log(formJson);

    const baseUrl = process.env.BACKEND_URL;

    const url = await getUrlFromType(baseUrl, req.body.type, "add");
    console.log(url);    
    
    const form = await removeFieldsAccordingToType(formJson, formJson.type);
    console.log(form);
    console.log(JSON.stringify(form));    

    await request.post({
        headers: {
            'content-type' : 'application/json; charset=utf-8'
        },
        url,
        encoding: 'latin1',
        body: JSON.stringify(form)
    });
    res.status(200).redirect("/add-registry");
})

const removeFieldsAccordingToType = async (form) => {
    if(form.type == "Tale") {
        delete form["time"];
    }
    delete form["type"];
    return form;
}

const getUrlFromType = async(url,type, operation) => {    
    const req = await request.get("http://localhost:8090/util/hierarchy/", async (error, response)=> {        
        if(error) {
            console.log("error on url from hierarchy");
        }
    });
    if(req) {
        console.log("hierarchy returned: " + req);
        hierarchy = req;       
    } else {    
        console.log("error querying registry order; using default.")
        hierarchy = "Tale;Book;Chapter;Paragraph";
    }
    let hierarchySplit = hierarchy.split(";");       
    let result = "error";
    hierarchySplit.forEach(arrayElement => {        
        if(arrayElement === type) {
            if(type == "Tale") {
                result = url + "tales/" +  getOperation(operation);
            } else if(type == "Book") {
                result = url + "books/" +  getOperation(operation);
            } else if(type == "Section") {
                result = url + "sections/" +  getOperation(operation);
            } else if(type == "Chapter") {
                result = url + "chapters/" +  getOperation(operation);
            } else if(type == "Paragraph") {
                result = url + "paragraphs/" +  getOperation(operation);
            } else if(type == "Accountable") {
                result = url + "accountables/" +  getOperation(operation);
            }
        }
    });
    return result; 
}

const getOperation = (operation) => {
    if(operation === "addChild") {
        return "addChild/";
    } else if (operation === "delChild") {
        return "delChild/";
    } else if (operation === "all") {
        return "all/";
    } else {
        return "";
    }
}

module.exports = router;