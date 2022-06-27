const express = require("express")
const router = new express.Router()
const request = require('request-promise').defaults({ encoding: 'latin1' });
const axios = require('axios').default;
const url = require('url');

const baseUrl = process.env.BACKEND_URL;

var selectedRegistry = undefined;
var selectedRegistryObject = undefined;
var selectedRegistryTree = undefined;

var breadCrumb = "Tale 1 > Book 1 > Section 1";
var levelNavHome = '<ion-icon name="home-outline" class="icon-small-level-nav" onclick="moveToIndex()"></ion-icon>';
var levelNavAdd = '<ion-icon name="add-circle-outline" class="icon-small-level-nav" onclick="moveToAddRegistry()"></ion-icon>';
var currentLevel = "List";

/** home - list - selected */
router.get("/", async (req, res) => {    
    
    let connectionStatus;
    try {
        await request(baseUrl + "actuator/health");
        connectionStatus = 'Ok' + '<ion-icon name="checkmark-circle-outline" class="icon-small-health-check-ok"></ion-icon>';
    } catch (err) {
        //
    }
    console.log("\n\naccess root\n\n");    

    breadCrumb = "Tale 1 > Book 1 > Section 1";

    let levelNavNext = '<ion-icon name="arrow-forward-outline" class="icon-small-level-nav"></ion-icon>'
    let levelNavPrevious = '<ion-icon name="arrow-back-outline" class="icon-small-level-nav"></ion-icon>';
    let levelNavTop = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav" ></ion-icon>';
    let levelNavVoid = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav-hidden" ></ion-icon>';
    let levelNavDump = '<ion-icon name="save-outline" class="icon-small-level-nav" ></ion-icon>';
    let levelNavRestore = '<ion-icon name="download-outline" class="icon-small-level-nav"></ion-icon>';        
    let levelNav = {levelNavPrevious, levelNavTop, levelNavNext, levelNavHome, levelNavAdd, levelNavVoid, levelNavDump, levelNavRestore};

    selectedRegistry = req.param("id");

    console.log("selectedRegistry");
    console.log(req.param("id"));                

    //get list
    try {
        if(!selectedRegistry || selectedRegistry == "") {
            console.log("selected registry tree is invalid. fetching tales");
            selectedRegistryTree = JSON.parse(await request.get(baseUrl + "tales/all"));
        } else {
            console.log("selected registry tree is valid, fetching same level");
            selectedRegistryObject = await findRegistryAndLevel(selectedRegistry);
            currentLevel = selectedRegistryObject.currentLevel;
            selectedRegistryObject = selectedRegistryObject.registryJson;
            selectedRegistryTree = JSON.parse(await request.get(baseUrl + currentLevel.toLowerCase() + "/all"));
        }
    } catch (err) {
        //
    }
    

    console.log("\n\nprerender\n\n");
    console.log(selectedRegistry);
    console.log(selectedRegistryTree);
    console.log(currentLevel);
    console.log("\n\n\\prerender\n\n");

    await res.render("index", {
            connectionStatus,
            breadCrumb,
            levelNav,
            selectedRegistry: selectedRegistryObject,
            selectedRegistryTree,
            currentLevel
    });
})

const findRegistryAndLevel = async (id) => {
    let registry = undefined;
    let currentLevel = undefined
    console.log("\n\n2 - registry \n\n"); //this need to die
    try {
        console.log(baseUrl + "tales/" + id);
        registry = await request.get(baseUrl + "tales/" + id);
        if(registry) {
            console.log("found tale");
            currentLevel = "Tales";
        } else {
            console.log(baseUrl + "books/" + id);
            registry = await request.get(baseUrl + "books/" + id);
            if(registry) {
                console.log("found book");
                currentLevel = "Books";
            } else {
                console.log(baseUrl + "sections/" + id);
                registry = await request.get(baseUrl + "sections/" + id);
                if(registry) {
                    currentLevel = "Sections";
                } else {
                    console.log(baseUrl + "chapters/" + id);
                    registry = await request.get(baseUrl + "chapters/" + id);
                    if(registry) {
                        currentLevel = "Chapters";
                    } else {
                        console.log(baseUrl + "paragraphs/" + id);
                        registry = await request.get(baseUrl + "paragraphs/" + id);
                        if(registry) {
                            currentLevel = "Paragraphs";
                        }
                    }
                }
            }
        }

    } catch (err) {
        console.log("err");        
        console.log(err.message);
    }
    console.log(registry);
    const registryJson = JSON.parse(registry);
    return {registryJson, currentLevel};

}

/** add - edit */
router.get("/add-registry", async (req, res) => {    
    
    console.log("add registry form");
    let connectionStatus;
    try {
        const health = await request.get(baseUrl + "actuator/health");
        if(health.err) {
            connectionStatus = 'Error' + '<ion-icon name="checkmark-circle-outline" class="icon-small-health-check-fail"></ion-icon>';
        } else {
            connectionStatus = 'Ok' + '<ion-icon name="checkmark-circle-outline" class="icon-small-health-check-ok"></ion-icon>';
        }
    }
    catch (err) {
        connectionStatus = 'Error' + '<ion-icon name="checkmark-circle-outline" class="icon-small-health-check-fail"></ion-icon>';
    }

    selectedRegistry = req.param("id");
    let registry = {};
    let currentLevel = "Tale";
    if(selectedRegistry != undefined && selectedRegistry != "") {
        try {
            console.log("fetching for edit : " + selectedRegistry);
            registry = await findRegistryAndLevel(selectedRegistry);
            currentLevel = registry.currentLevel;
            registry = registry.registryJson;
        } catch (err) {
            //ok
            console.log("not found");
        }
    }
    
    let hierarchy = "Tale;Book;Chapter;Paragraph";
    let selectedHierarchy = "Tale";

    try {
        const hierarquyResquest = await request.get(baseUrl + "util/hierarchy/");
        hierarchy = hierarquyResquest;
    } catch (err) {
        console.log("error recovering hierarchy. using defaults")
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

    console.log(registry);
    
    await res.render("addRegistry", {
        connectionStatus,
        breadCrumb,
        levelNav,
        hierarchyList,
        selectedHierarchy,
        registry,
        selectedRegistryTree,
        currentLevel
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
    formJson.id = requestBody.id;
    console.log(formJson);

    const urllocal = await getUrlFromType(baseUrl, req.body.type, "add");
    console.log(urllocal);    
    
    const form = await removeFieldsAccordingToType(formJson, formJson.type);
    console.log(form);
    console.log(JSON.stringify(form));    

    await request.post({
        headers: {
            'content-type' : 'application/json; charset=utf-8'
        },
        url:urllocal,
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

const getUrlFromType = async(urllocal,type, operation) => {    
    const req = await request.get(baseUrl + "util/hierarchy/");    
    if(req) {
        console.log("hierarchy returned: " + req);
        hierarchy = req;       
    } else {    
        console.log("error querying registry order; using default.")
        hierarchy = "Tales;Books;Chapters;Paragraphs";
    }
    let hierarchySplit = hierarchy.split(";");       
    let result = "errorUrlFromTypeAndOperation";
    hierarchySplit.forEach(arrayElement => {
        if(arrayElement == type) {            
            console.log(type);
            if(type == "Tale" || type == "Tales") {
                result = urllocal + "tales/" +  getOperation(operation);
            } else if(type == "Book" || type == "Books") {
                result = urllocal + "books/" +  getOperation(operation);
            } else if(type == "Section" || type == "Sections") {
                result = urllocal + "sections/" +  getOperation(operation);
            } else if(type == "Chapter" || type == "Chapters") {
                result = urllocal + "chapters/" +  getOperation(operation);
            } else if(type == "Paragraph" || type == "Paragraphs") {
                result = urllocal + "paragraphs/" +  getOperation(operation);
            } else if(type == "Accountable" || type == "Accountables") {
                result = urllocal + "accountables/" +  getOperation(operation);
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
    // } else if (operation === "delete") {
    //     return "delete/";
    } else if (operation === "all") {
        return "all";
    }
    return "";

}

router.get("/undefine", async (req, res) => {
    console.log("UNSET");
    selectedRegistry = undefined;
    selectedRegistryObject = undefined;
    selectedRegistryTree = undefined;
    res.render("index");
})

router.get("/select-element", async (req, res) => {
    console.log(req.param("id"));
    res.status(200).send({id: req.param("id")});
})

router.get("/edit-element", async (req, res) => {
    res.status(200).send({id: req.param("id")});
})

router.get("/delete-element", async (req, res) => {
    let id = req.param("id");
    let type = req.param("type");    
    try {
        let registry = await findRegistryAndLevel(selectedRegistry);
        let currentLevel = registry.currentLevel;
        registry = registry.registryJson;
        console.log("trying my luck");
        console.log(type);
        console.log(id);
        const urllocal = await getUrlFromType(baseUrl, type, "delete") + id;        
        console.log(urllocal);        
        await axios.delete(urllocal);
    } catch (error) {
        //ok
    }
    console.log("hit1");
    selectedRegistry = undefined;
    selectedRegistryObject = undefined;
    selectedRegistryTree = undefined;
    res.status(200).redirect("/element-deleted");
})

router.get("/element-deleted", async (req, res) => {
    console.log("hit2");
    //res.status(200).redirect("/?timestamp=" + new Date().getTime);
    //res.redirect(url.parse(req.url).pathname);
    //res.status(200).render("/");
    res.status(200).redirect("/");
})



module.exports = router;