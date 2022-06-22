function moveToIndex(){
    $.ajax({
        url: '/',
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

function submitAddRegistry(){    
    document.getElementById("registryForm").submit();
}

function clearAddRegistry(){
    document.getElementById("registryForm").reset();
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