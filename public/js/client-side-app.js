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

function submitAddRegistry(){    
    document.getElementById("registryForm").submit();
}

function clearAddRegistry(){
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

/*
function addSleepCycle(){
    //const id = document.querySelector('.userId').value
    $.ajax({
        url: '/',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: window.location.href = '/'
    });
}*/