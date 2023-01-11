const express = require("express")
const router = new express.Router()
const request = require('request-promise').defaults({ encoding: 'latin1' });
const axios = require('axios').default;
const url = require('url');

const baseUrl = process.env.BACKEND_URL;

var selectedRegistry = undefined;
var selectedRegistryObject = undefined;
var selectedRegistryTree = undefined;

var breadCrumb = " > ";
var levelNavHome = '<ion-icon name="home-outline" class="icon-small-level-nav" onclick="moveToIndex()"></ion-icon>';
var levelNavAdd = '<ion-icon name="add-circle-outline" class="icon-small-level-nav" onclick="moveToAddRegistry()"></ion-icon>';
var currentLevel = "List";
var selectedHierarchy;
var navigation = {};

/** home - list - selected */
router.get("/", async (req, res) => {    
    
    let connectionStatus;
    try {
        await request(baseUrl + "actuator/health");
        connectionStatus = 'Ok' + '<ion-icon name="checkmark-circle-outline" class="icon-small-health-check-ok"></ion-icon>';
    } catch (err) {
        //
    }
    console.log("---------------------------------------------- \naccess root\n----------------------------------------------");
    
    /** this repeats for now */
    let hierarchy = "Tale;Book;Chapter;Paragraph";
    const hierarquyResquest = await axios.get(baseUrl + "util/hierarchy/");    
    hierarchy = hierarquyResquest;
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
    
    let accumulatedAccountables;

    //get list
    
    let childList = [];
    try {
        if(!selectedRegistry || selectedRegistry == "") {
            console.log("selected registry tree is invalid. fetching tales");
            currentLevel = hierarchyList[0];
            console.log("current level : " + currentLevel);
            let registryByType;
            try {
                registryByType = await axios.get(baseUrl + "registry/type/" + currentLevel);
                selectedRegistryTree = registryByType.data;
            } catch(err) {
                console.log("YKES");
            }
            
        } else {
            selectedRegistry.children = [];
            console.log("selected registry tree is valid, fetching same level");
            selectedRegistryObject = await findRegistryAndLevel(selectedRegistry);
            currentLevel = selectedRegistryObject.currentLevel;
            selectedRegistryObject = selectedRegistryObject.registryJson;
            selectedRegistryTree = JSON.parse(await request.get(baseUrl + "registry/type/" + currentLevel));
            
            accumulatedAccountables = await getAccountablesForRegistryId(selectedRegistryObject.id);

            //filthy hack
            console.log("fetching children");
            selectedRegistryObject.children = [];
            
            if(selectedRegistryObject.childs != undefined && selectedRegistryObject.childs.length > 0) {                
                childList = selectedRegistryObject.childs;
            }

            breadCrumb = await getBreadCrumb(currentLevel, selectedRegistryObject.title, hierarchyList);
            levelNavAdd = '<ion-icon name="add-circle-outline" class="icon-small-level-nav" onclick="moveToAddRegistry(\'' + selectedRegistry + '\')"></ion-icon>';
            try {
                await getNextAndPreviousLinks(selectedRegistryObject.id, selectedRegistryTree);
                if(navigation.next) {
                    levelNavNext = '<ion-icon name="arrow-forward-outline" class="icon-small-level-nav" onclick="selectRegistry(\'' + navigation.next + '\')"></ion-icon>'
                }
                if(navigation.previous) {
                    levelNavPrevious = '<ion-icon name="arrow-back-outline" class="icon-small-level-nav" onclick="selectRegistry(\'' + navigation.previous + '\')"></ion-icon>';
                }
                if(navigation.top) {
                    levelNavTop = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav" onclick="selectRegistry(\'' + navigation.top + '\')"></ion-icon>';
                }
                levelNav = {levelNavPrevious, levelNavTop, levelNavNext, levelNavHome, levelNavAdd, levelNavVoid, levelNavDump, levelNavRestore};
            } catch (errNav) {
                console.log("error fetching navigational links.");
                console.log(errNav);
            }
            
        }
    } catch (err) {
        //
    }    
    for(const arrayElement of childList) {
        try { 
            console.log("child: " + arrayElement);
            const child = await findRegistryAndLevel(arrayElement);
            const childElement = {id: arrayElement, title: child.registryJson.title, father:selectedRegistryObject.id, level: currentLevel};
            console.log("child Element: ");
            console.log(childElement);
            selectedRegistryObject.children.push(childElement);

        } catch (err) {
            console.log(err);
        }
    }

    console.log("\n\nprerender\n\n");

    const showAddAccountables = true; //TODO XXX REVALIDATE OR REMOVE

    console.log("selectedRegistry\n");
    console.log(selectedRegistry);
    console.log("selectedRegistryTree\n");
    console.log(selectedRegistryTree);
    console.log("level\n");
    console.log(currentLevel);
    console.log("selectedRegistryObject\n");
    console.log(selectedRegistryObject);
    console.log("\n\n");
    console.log("-------------------------------------------------------------------");
    console.log("\n\prerender\n");
    console.log("-------------------------------------------------------------------");
    console.log("\n");

    

    res.render("index", {
            connectionStatus,
            breadCrumb,
            levelNav,
            selectedRegistry: selectedRegistryObject,
            selectedRegistryTree,
            currentLevel,
            showAddAccountables,
            accumulatedAccountables
    });
})

const getNextAndPreviousLinks = async (registryId, selectedRegistryTree) => {
    console.log("next and previous");
    navigation = {};
    let previous;
    let first;
    let found = false;
    let count = 0;
    if(selectedRegistryTree) {
        for(const element of selectedRegistryTree) {
            console.log("element");
            console.log(element);
            console.log("element");
            console.log(count++);
            if(!first) {
                first = element;
            }
            if(element.id == registryId) {
                if(previous) {
                    navigation.previous = previous.id;
                }                
                found = true;
                console.log("found");
            } else {
                if(found) {
                    console.log("setting next");
                    navigation.next = element.id;
                    break;
                } else {
                    console.log("else setting prev");
                    previous = element;
                }
            }
        }

    }
    try {
        let response = await axios.get(baseUrl + "registry/find-parent/" + registryId);
        console.log("finding parent for navigation for " + registryId);
        if(response.data) {
            console.log("parent found: " + response.data);
            navigation.top = response.data;
        }
    } catch (err) {
        console.log("error populating navigation!");
        console.log(err);
        //Ok, dont populate navigation object
    }
    return true;
}

const getAccountablesForRegistryId = async (id) => {    
    console.log(selectedRegistryObject);
    try {
        accumulatedAccountables = await axios.get(baseUrl + "registry/accountables-for-entity/" + selectedRegistryObject.id);
        console.log("Accumulated Accountables from " + selectedRegistryObject.id);
        console.log(accumulatedAccountables.data);
        
    } catch (err) {
        console.log("error trying to get all accountables for registry.");
    }
    return accumulatedAccountables.data;
}

const getBreadCrumb = async (currentLevel, currentTitle, hierarchyList) => {
    let breadCrumb = "";
    for(const element of hierarchyList) {
        if(element == currentLevel) {
            breadCrumb = breadCrumb + " > " + currentTitle;
            break;
        } else {
            breadCrumb = breadCrumb + " > " + element;
        }
    }
    return breadCrumb;
    
}

const findRegistryAndLevel = async (id) => {
    let registry = undefined;
    console.log("\n\nFind level and registry \n\n"); //this need to die
    try {
        console.log(baseUrl + "registry/" + id);
        registry = await request.get(baseUrl + "registry/" + id);
        console.log("found register");
    } catch (err) {
        console.log("error finding register");        
        console.log(err.message);
    }
    console.log("registry recovered!");
    console.log(registry);
    const registryJson = JSON.parse(registry);
    const currentLevel = registryJson.type;
    return {registryJson, currentLevel};

}

/** add - edit */
router.get("/add-registry", async (req, res) => {

    /** this repeats for now */
    let hierarchy = "Tale;Book;Chapter;Paragraph";    
    try {
        const hierarquyResquest = await axios.get(baseUrl + "util/hierarchy/");
        hierarchy = hierarquyResquest.data;
    } catch (err) {
        console.log("error recovering hierarchy. using defaults")
    }   
    let parentId = req.param("parentId");
    console.log("adding child to parent " + parentId);

    let hierarchySplit = hierarchy.split(";");
    let hierarchyList = [];
    hierarchySplit.forEach(arrayElement => {
        hierarchyList.push(arrayElement);
    })
    console.log(hierarchyList);  
    
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
        currentLevel,
        parentId
    });
})

/** add - edit accountables*/
router.get("/add-accountable", async (req, res) => {    
    
    console.log("add accountable form");
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
    const parentId = req.param("parentId")
    if(selectedRegistry) {
        console.log("adding accountable to parent id " + selectedRegistry);
    } else {
        console.log("accountable parent id not set");
    }
    
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
    
    breadCrumb = "Add new Accountable > ";

    var levelNavNext = '<ion-icon name="arrow-forward-outline" class="icon-small-level-nav-hidden"></ion-icon>'
    var levelNavPrevious = '<ion-icon name="arrow-back-outline" class="icon-small-level-nav-hidden"></ion-icon>';
    var levelNavTop = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav-hidden" ></ion-icon>';
    let levelNavVoid = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav-hidden" ></ion-icon>';
    let levelNavDump = '<ion-icon name="add-circle-outline" class="icon-small-level-nav-hidden" ></ion-icon>';
    let levelNavRestore = '<ion-icon name="add-circle-outline" class="icon-small-level-nav-hidden"></ion-icon>';
    let levelNav = {levelNavPrevious, levelNavTop, levelNavNext, levelNavHome, levelNavAdd, levelNavVoid, levelNavDump, levelNavRestore};

    console.log(registry);
    
    await res.render("addAccountable", {
        connectionStatus,
        breadCrumb,
        levelNav,
        hierarchyList,
        selectedHierarchy,
        registry,
        selectedRegistryTree,
        currentLevel,
        selectedRegistry,
        parentId
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
    formJson.type = requestBody.type;
    formJson.owner = "admin";
    formJson.id = requestBody.id;
    console.log(formJson);

    const urllocal = await getUrlFromType(baseUrl, req.body.type, "add");
    console.log(urllocal);    
    
    const form = formJson;
    console.log(form);
    console.log(JSON.stringify(form));    

    const response = await request.post({
        headers: {
            'content-type' : 'application/json; charset=utf-8'
        },
        url:urllocal,
        encoding: 'latin1',
        body: JSON.stringify(form)
    });
    const formlink = {id : requestBody.parentId, childs : [ JSON.parse(response).id ]};
    if(requestBody.parentId != undefined && requestBody.parentId != "" && requestBody.parentId != "undefined") {
        await request.post({
            headers: {
                'content-type' : 'application/json; charset=utf-8'
            },
            url:baseUrl + "registry/addChild/",
            encoding: 'latin1',
            body: JSON.stringify(formlink)
        });
    }
    res.status(200).redirect("/add-registry");
})

router.post("/add-accountable-submit", async (req, res) => {
    console.log("adding accountable.");
    console.log(req.body);
    
    const requestBody = req.body;
    const formJson = {};
    formJson.title = requestBody.title;
    formJson.name = requestBody.name;
    formJson.ionIcon = requestBody.ionIcon;
    formJson.amount = requestBody.amount;
    formJson.visible = true;
    formJson.id = requestBody.id;
    if(!formJson.id) {
        formJson.id = "";
    }
    
    //formJson.id = requestBody.id;
    console.log(formJson);

    const urllocal = await getUrlFromType(baseUrl, "Accountable", "add");
    console.log(urllocal);    
    
    const form = formJson;
    console.log(form);
    console.log(JSON.stringify(form));    

    let response = await request.post({
        headers: {
            'content-type' : 'application/json; charset=utf-8'
        },
        url:urllocal,
        encoding: 'latin1',
        body: JSON.stringify(form)
    });
    console.log("POST RESPONSE FROM ADD ACCOUNTABLE");
    console.log(response);
    const formLink = {id : requestBody.parentId, accountables : [ JSON.parse(response).id ]}
    const urllocalLinkParent = baseUrl + "registry/addAccountable/";

    //link to parent
    const goNowhere = await request.post({
        headers: {
            'content-type' : 'application/json; charset=utf-8'
        },
        url:urllocalLinkParent,
        encoding: 'latin1',
        body: JSON.stringify(formLink)
    });

    res.status(200).redirect("/add-accountable");
})

const getUrlFromType = async(urllocal,type, operation) => {    
    let result = "errorUrlFromTypeAndOperation";
    if(type == "Accountable" || type == "Accountables") {
        console.log("whaaaaaaaaaaaat");
        result = urllocal + "accountables/" +  getOperation(operation);
    } else {
        result = urllocal + "registry/" +  getOperation(operation);
    }
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
    } //TODO XXX FIX ACCOUNTABLES HERE?
    return "";

}

router.get("/undefine", async (req, res) => {
    console.log("UNSET");
    selectedRegistry = undefined;
    selectedRegistryObject = undefined;
    selectedRegistryTree = undefined;
    breadCrumb = " > ";
    currentLevel = "Tales";
    navigation = {};
    res.render("index");
})

router.get("/select-element", async (req, res) => {
    console.log(req.param("id"));
    res.status(200).send({id: req.param("id")});
})

router.get("/edit-element", async (req, res) => {
    res.status(200).send({id: req.param("id")});
})

router.get("/edit-element-acc", async (req, res) => {
    res.status(200).send({id: req.param("id")});
})

router.get("/delete-element", async (req, res) => {
    let id = req.param("id");
    let type = req.param("type");    
    try {
        let registry = await findRegistryAndLevel(selectedRegistry);
        let currentLevel = registry.currentLevel;
        registry = registry.registryJson;        
        const urllocal = await getUrlFromType(baseUrl, type, "delete") + id;        
        console.log(urllocal);        
        await axios.delete(urllocal);
    } catch (error) {
        //ok
    }
    
    selectedRegistry = undefined;
    selectedRegistryObject = undefined;
    selectedRegistryTree = undefined;
    res.status(200).redirect("/element-deleted");
})

router.get("/element-deleted", async (req, res) => {        
    res.status(200).redirect("/");
})

router.get("/add-child", async (req, res) => {    
    
    let id = req.param("id");
    breadCrumb = "Tale 1 > Book 1 > Section 1";
    console.log(id);

    let levelNavNext = '<ion-icon name="arrow-forward-outline" class="icon-small-level-nav"></ion-icon>'
    let levelNavPrevious = '<ion-icon name="arrow-back-outline" class="icon-small-level-nav"></ion-icon>';
    let levelNavTop = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav" ></ion-icon>';
    let levelNavVoid = '<ion-icon name="arrow-up-outline" class="icon-small-level-nav-hidden" ></ion-icon>';
    let levelNavDump = '<ion-icon name="save-outline" class="icon-small-level-nav" ></ion-icon>';
    let levelNavRestore = '<ion-icon name="download-outline" class="icon-small-level-nav"></ion-icon>';        
    let levelNav = {levelNavPrevious, levelNavTop, levelNavNext, levelNavHome, levelNavAdd, levelNavVoid, levelNavDump, levelNavRestore};

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

    res.render("addChild", {id, levelNav, breadCrumb, selectedRegistryTree, currentLevel});
})

router.post("/add-child-submit", async (req, res) => {
    console.log("adding child.");
    console.log(req.body);
    
    const requestBody = req.body;
    const type = req.body.type;
    const operation = "addChild";
    const formJson = {};

    formJson.id = requestBody.id;    

    //this needs to die
    console.log("this also needs to die");
    const hierarchyRequest = await request.get(baseUrl + "util/hierarchy/");    
    if(req) {
        console.log("hierarchy returned: " + hierarchyRequest);
        hierarchy = hierarchyRequest;       
    } else {    
        console.log("error querying registry order; using default.")
        hierarchy = "Tales;Books;Chapters;Paragraphs";
    }
    let hierarchySplit = hierarchy.split(";");       
    let urllocal = "errorUrlFromTypeAndOperation";
    urllocal = baseUrl + "registry/" +  getOperation(operation);
    formJson.childs = [req.body.child];
    console.log(formJson);
    console.log(urllocal);
    try {
        await request.post({
            headers: {
                'content-type' : 'application/json; charset=utf-8'
            },
            url:urllocal,
            encoding: 'latin1',
            body: JSON.stringify(formJson)
        });
    } catch (err) {
        //well
    }
    
    res.status(200).redirect("/add-child");
})

router.get("/del-child", async (req, res) => {
    console.log("del child");
    let id = req.param("id");
    let father = req.param("father");
    let type = req.param("level");
    console.log(req.param("id"));
    console.log(req.param("father"));
    console.log(req.param("type"));
    try {
        
        const urllocal = await getUrlFromType(baseUrl, type, "delChild");
        let formJson = {
            id: father
        }

        //please die again
        console.log("please die again");
        formJson.childs = [id];
        console.log(urllocal);
        console.log(formJson);

        await request.post({
            headers: {
                'content-type' : 'application/json; charset=utf-8'
            },
            url: urllocal,
            encoding: 'latin1',
            body: JSON.stringify(formJson)
        });
    } catch (error) {
        //ok
    }
    res.status(200).redirect("/element-deleted");
})

module.exports = router;