function moveToIndex(){
    $.ajax({
        url: '/undefine',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: window.location.href = '/'
    });
}

function moveToAddRegistry(){
    $.ajax({
        url: '/add-registry',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: window.location.href = '/add-registry'
    });
}

function moveToAddAccountable(){
    $.ajax({
        url: '/add-accountable',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: window.location.href = '/add-accountable'
    });
}

function editRegistry(id){
    $.ajax({
        url: '/edit-element',
        type: 'GET',
        data: {
            id: id
        },
        async: false,
        contentType: 'application/json; charset=utf-8',
        success: window.location.href = function (response){
            window.location.replace("/add-registry?id=" + response.id);
        }
    });
}

function submitForm(){    
    document.getElementById("registryForm").submit();
}

function clearForm(){
    document.getElementById("registryForm").reset();
}

function deleteRegistry(id, type) {    
    $.ajax({
        url: '/delete-element',
        type: 'GET',
        data: {
            id: id,
            type: type
        },
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: function () {
            document.location.replace("/");
            document.location.reload(true);
        }
    });
}

function selectRegistry(id){
    $.ajax({
        url: '/select-element',
        type: 'GET',
        data: {
            id: id
        },
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: function (response) {
            window.location.replace("/?id=" + response.id);
        }

    });
}

function addChild(id){
    $.ajax({
        url: '/add-child',
        type: 'GET',
        data: {
            id: id
        },
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: function () {
            document.location.replace("/add-child?id=" + id);
        }
    });
}

function delChild(father, id, level){
    $.ajax({
        url: '/del-child',
        type: 'GET',
        data: {
            father: father,
            id: id,
            level: level
        },
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: function () {
            document.location.replace("/");
            document.location.reload(true);
        }
    });
}