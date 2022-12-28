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
            selectedRegistryTree = JSON.parse(await request.get(baseUrl + "tales/all"));
        } else {
            selectedRegistry.children = [];
            console.log("selected registry tree is valid, fetching same level");
            selectedRegistryObject = await findRegistryAndLevel(selectedRegistry);
            currentLevel = selectedRegistryObject.currentLevel;
            selectedRegistryObject = selectedRegistryObject.registryJson;
            selectedRegistryTree = JSON.parse(await request.get(baseUrl + currentLevel.toLowerCase() + "/all"));
            
            accumulatedAccountables = await getAccountablesForRegistryId(selectedRegistryObject.id);

            //filthy hack
            console.log("fetching children");
            selectedRegistryObject.children = [];
            
            if(selectedRegistryObject.books != undefined && selectedRegistryObject.books.length > 0) {                
                childList = selectedRegistryObject.books;
            } else if(selectedRegistryObject.sections != undefined && selectedRegistryObject.sections.length > 0) {
                childList = selectedRegistryObject.sections;
            } else if(selectedRegistryObject.chapter != undefined && selectedRegistryObject.chapter.length > 0) {
                childList = selectedRegistryObject.chapter;
            } else if(selectedRegistryObject.paragraphs != undefined && selectedRegistryObject.paragraphs.length > 0) {
                childList = selectedRegistryObject.paragraphs;
            } else if(selectedRegistryObject.accountables != undefined && selectedRegistryObject.accountables.length > 0) {                
                childList = selectedRegistryObject.accountables;             
            }
            
            breadCrumb = await getBreadCrumb(currentLevel, selectedRegistryObject.title, hierarchyList);           
            await getNextAndPreviousLinks(selectedRegistryObject.id);
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

    const showAddAccountables = currentLevel == "Paragraphs";    

    console.log("selectedRegistry\n");
    console.log(selectedRegistry);
    console.log("selectedRegistryTree\n");
    console.log(selectedRegistryTree);
    console.log("level\n");
    console.log(currentLevel);
    console.log("selectedRegistryObject\n");
    console.log(selectedRegistryObject);
    console.log("\n\n\\prerender\n\n");

    

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

const getNextAndPreviousLinks = async (registryId) => {
    navigation = {};
    let previous;
    let first;
    let found = false;
    if(selectedRegistryTree) {
        for(const element of selectedRegistryTree) {
            if(!first) {
                first = element;
            }
            if(element.id == registryId) {
                navigation.previous = previous.id;
                found = true;
            } else {
                if(found) {
                    navigation.next = element.id;
                    break;
                } else {
                    previous = element;
                }
            }
        }

    }
    try {
        let response = await axios.get(baseUrl + "util/find-parent/" + registryId);
        console.log("finding parent for navigation for " + registryId);
        if(response.data) {
            console.log("parent found: " + response.data);
            navigation.top = response.data;
        }
    } catch (err) {
        //Ok, dont populate navigation object
    }
}

const getAccountablesForRegistryId = async (id) => {    
    console.log(selectedRegistryObject);
    try {
        accumulatedAccountables = await axios.get(baseUrl + "accountables/accountables-for-entity/" + selectedRegistryObject.id);
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
    let currentLevel = undefined
    console.log("\n\nFind level and registry \n\n"); //this need to die
    try {
        console.log(baseUrl + "tales/" + id);
        registry = await request.get(baseUrl + "tales/" + id);
        console.log("found tale");
        currentLevel = "Tales";
    } catch (errTales) {
        try {
            console.log(baseUrl + "books/" + id);
            registry = await request.get(baseUrl + "books/" + id);
            console.log("found book");
            currentLevel = "Books";
        } catch (errBooks) {
            try {
                console.log(baseUrl + "sections/" + id);
                registry = await request.get(baseUrl + "sections/" + id);
                currentLevel = "Sections";
            } catch (errSections) {
                try {
                    console.log(baseUrl + "chapters/" + id);
                    registry = await request.get(baseUrl + "chapters/" + id);
                    currentLevel = "Chapters";
                } catch (errChapters) {
                    try {
                        console.log(baseUrl + "paragraphs/" + id);
                        registry = await request.get(baseUrl + "paragraphs/" + id);
                        currentLevel = "Paragraphs";
                    } catch (errParagraphs) {
                        try {
                            console.log(baseUrl + "accountables/" + id);
                            registry = await request.get(baseUrl + "accountables/" + id);
                            currentLevel = "Accountables";
                        } catch (errSections) {
                            console.log("error finding register");        
                            console.log(err.message);                                                   
                        }
                    }
                }
            }
        }
    }
    console.log("registry recovered!");
    console.log(registry);
    const registryJson = JSON.parse(registry);
    return {registryJson, currentLevel};

}

/** add - edit */
router.get("/add-registry", async (req, res) => {

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
        currentLevel
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
    formJson.type = "Accountable";
    
    formJson.id = requestBody.id;
    console.log(formJson);

    const urllocal = await getUrlFromType(baseUrl, "Accountable", "add");
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
    res.status(200).redirect("/add-accountable");
})

const removeFieldsAccordingToType = async (form) => {
    if(form.type == "Tale") {
        delete form["time"];
    }
    if(form.type == "Accountable") {
        delete form["owner"];
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
    if(type == "Accountable" || type == "Accountables") {
        console.log("whaaaaaaaaaaaat");
        result = urllocal + "accountables/" +  getOperation(operation);
    }
    for(const arrayElement of hierarchySplit) {
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
    };
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
    hierarchySplit.forEach(arrayElement => {
        console.log(arrayElement);
        if(arrayElement == type) {            
            console.log(type);
            if(type == "Tale" || type == "Tales") {
                urllocal = baseUrl + "tales/" +  getOperation(operation);
                formJson.books = [req.body.child];
            } else if(type == "Book" || type == "Books") {
                urllocal = baseUrl + "books/" +  getOperation(operation);
                formJson.sections = [req.body.child];
            } else if(type == "Section" || type == "Sections") {
                urllocal = baseUrl + "sections/" +  getOperation(operation);
                formJson.chapter = [req.body.child];
            } else if(type == "Chapter" || type == "Chapters") {
                urllocal = baseUrl + "chapters/" +  getOperation(operation);
                formJson.paragraphs = [req.body.child];
            } else if(type == "Paragraph" || type == "Paragraphs") {
                urllocal = baseUrl + "paragraphs/" +  getOperation(operation);
                formJson.accountables = [req.body.child];
            }
        }
    });
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

        if(type == "Tale" || type == "Tales") {
            formJson.books = [id];
        } else if(type == "Book" || type == "Books") {
            formJson.sections = [id];
        } else if(type == "Section" || type == "Sections") {
            formJson.chapter = [id];
        } else if(type == "Chapter" || type == "Chapters") {            
            formJson.paragraphs = [id];
        } else if(type == "Paragraph" || type == "Paragraphs") {
            formJson.accountables = [id];
        }

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