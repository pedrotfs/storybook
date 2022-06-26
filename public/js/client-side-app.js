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
        url: '/add-registry',
        type: 'GET',
        data: {
            id: id
        },
        async: false,
        contentType: 'application/json; charset=utf-8',
        success: window.location.href = '/add-registry'
    });
}

function submitAddRegistry(){    
    document.getElementById("registryForm").submit();
}

function clearAddRegistry(){
    document.getElementById("registryForm").reset();
}

function selectRegistry(id, name){    
    console.log(new Date().getTime());    
    $.ajax({
        url: '/?' + new Date().getTime(),
        type: 'GET',
        data: {
            name: name,
            id: id
        },
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: window.location.reload(true)
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