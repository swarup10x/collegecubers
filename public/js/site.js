// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.
var MaxNumberOfCubesForPortrait = 3000;
var autoSaveDirty = 0; //1=Green (no change needed); 0=Yellow (changing); -1:Red (Error saving) 

var inputImagePNG = document.getElementById("inputImagePNG");
var user = getUserCookie()



console.log('checking user ', user)
if (user && user['_id']) {
    console.log('user exists', user)
    //TODO load session projectName,Crop,adjust,paint,{colors,sliderColorValues}
    const registerLink = document.getElementById("register"); // get the link with id "register"
    if (registerLink) {
        const parentLi = registerLink.parentNode; // get the parent element (li) of the link
        const parentUl = parentLi.parentNode;
        parentUl.innerHTML = `
        <li class="nav-item ">
        <a id="manage" class="nav-link text-light" title="Manage" href="/Identity/Account/Manage/FileManager"><i class="fas fa-user"></i></a>
    </li>
    <li class="nav-item">
        <form id="logoutForm" class="form-inline" action="/Identity/Account/Logout" method="post">
            <button id="logout" type="submit" class="nav-link btn btn-link text-light">Logout</button>
        <input name="__RequestVerificationToken" type="hidden" value="CfDJ8IgtAQauWkVEqa8K9eLk73NyXZ4XXRKuvTh1TXCs1fAwXfWCKULoTsyB5qds_e6nsNZcB85oqtJECR4z7dzu0ns9OPSVuLRTtOf7ocrM5Yui_d8soEmWuClAv1NVOAwBdQH_n77axaL2uokyLjp4P82Xnn7FooHaLRBGuUs-LmHKsdEXdJVoZJo9Wr7hGkO2Ig" /></form>
    </li>
        `

        const logoutForm = document.querySelector('#logoutForm');

        logoutForm?.addEventListener('submit', (event) => {
            console.log('logging out')
            clearSessionStorage()
        });
    }

}



function clearSessionStorage() {
    sessionStorage.removeItem('projectName');
    sessionStorage.removeItem('Adjust');
    sessionStorage.removeItem('Paint');
    sessionStorage.removeItem('Crop');
    sessionStorage.removeItem('OG');
    sessionStorage.removeItem('colors');
    sessionStorage.removeItem('sliderColorValues');
    sessionStorage.removeItem('openedProject');
}

function imageDownload(button, img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    button.href = canvas.toDataURL('image/png');
}

function imageSaveToServer(img, imageType, suffix) {

    // console.log('imageType', imageType)
    if (img.naturalWidth > 0) {
        var canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var imageDataUrl = canvas.toDataURL("image/png")
        inputImagePNG.value = imageDataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
        var dataUrl = inputImagePNG.value
        const binaryString = atob(dataUrl);
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);

        for (let i = 0; i < binaryLen; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: 'image/png' });

        const formData = new FormData();
        formData.append('image', blob, 'image.png');
        console.log(formData.values)

        console.log(formData)
        console.log(inputImagePNG.values ? '--image found' : '--no image found')


        function finishSetSession() {
            console.log('trying finishsetsession')
            setSessionImage(imageDataUrl, imageType, suffix).then(hideWaitSpinner())
                .catch((error) => {
                    if (autoSaveDirty == 0) {
                        autoSaveDirty = -1;
                        updateAutoSavedLabel();
                        showAutoSaveFailedModal();
                    }
                    console.error('Error:', error);
                });
        }
        console.log('lookin for user')
        if (user) {
            console.log('user found')
            var projectid = sessionStorage.getItem('openedProject')
            fetch(`/Helpers/ImageHelper?projectid=${projectid}&imageType=${imageType}&suffix=${suffix}&handler=SaveToServer`, {
                method: 'post',
                body: formData
            }).catch((e) => console.log(e));
        }
        finishSetSession()

    }
}

function getUserCookie() {
    var key = 'user';
    var cookies = document.cookie.split(';');
    console.log('cookies', cookies)

    for (const cookie of cookies) {
        if (cookie.trim().startsWith(`${key}=`)) {
            let encodedValue = cookie.trim().substr(key.length + 1);
            let decodedValue = decodeURIComponent(encodedValue);
            console.log(decodedValue);

            let user = JSON.parse(decodedValue);
            console.log(user);
            return user;
        }
    }

    return undefined;
}


async function setSessionImage(imgDataUrl, imageType, suffix) {

    var input = document.getElementById("inputImage" + suffix);
    var form = document.getElementById("formImage" + suffix);
    console.log('trying set session image')
    try {
        sessionStorage.setItem(imageType, imgDataUrl)
        console.log('session saved')
        autoSaveDirty = 1;
        updateAutoSavedLabel();
    } catch (error) {
        console.log(error)
        if (autoSaveDirty == 0) {
            autoSaveDirty = -1;
            updateAutoSavedLabel();
            showAutoSaveFailedModal();
        }
        console.error('Error:', error);
    }


    return false;
}

function showAutoSaveFailedModal() {
    showInfoModal("AUTOSAVE FAILED", "There was a network error trying to save.  Be sure to download any changes to your computer.  We will keep trying to save, and if it works, the checkmark will turn green.");
}

function updateAutoSavedLabel() {
    var spanAutosaved = document.getElementById("spanAutosaved");
    if (spanAutosaved != null) {
        if (autoSaveDirty == -1) {
            spanAutosaved.style.color = "Red";
            spanAutosaved.innerHTML = "<i class='fas fa-exclamation-triangle'></i>";
        }
        else if (autoSaveDirty == 0) {
            spanAutosaved.style.color = "Yellow";
            spanAutosaved.style.webkitTextStroke = "1px black";
            spanAutosaved.innerHTML = "<i class='fas fa-exclamation-triangle'></i>";
        }
        else if (autoSaveDirty == 1) {
            spanAutosaved.style.color = "Green";
            spanAutosaved.innerHTML = "<i class='fas fa-check-square'></i>";
        }
    }
}

function textBoxNumbersOnly() {
    return (event.charCode == 8 || event.charCode == 0 || event.charCode == 13) ? null : event.charCode >= 48 && event.charCode <= 57;
}

function createCubelike(button, img) {
    var WidthOfBorder = 11;

    var canvasOG = document.createElement("canvas");
    canvasOG.width = img.naturalWidth;
    canvasOG.height = img.naturalHeight;
    var ctxOG = canvasOG.getContext("2d");
    ctxOG.drawImage(img, 0, 0);
    var imgDataOG = ctxOG.getImageData(0, 0, img.naturalWidth, img.naturalHeight);

    var canvasOUT = document.createElement("canvas");
    canvasOUT.width = img.naturalWidth * WidthOfBorder;
    canvasOUT.height = img.naturalHeight * WidthOfBorder;
    var ctx = canvasOUT.getContext("2d");
    //ctx.drawImage(imgOriginal, 0, 0);
    var imgData = ctx.getImageData(0, 0, img.naturalWidth * WidthOfBorder, img.naturalHeight * WidthOfBorder);

    for (h = 0; h < img.naturalHeight; h++) {
        for (w = 0; w < img.naturalWidth; w++) {

            var start = (img.naturalWidth * h * 4) + (4 * w);

            for (c = 0; c < WidthOfBorder; c++) {
                for (d = 0; d < WidthOfBorder; d++) {
                    var outStart = (4 * ((w * WidthOfBorder) + c)) + (4 * ((h * WidthOfBorder) + d) * canvasOUT.width);

                    if (c >= 10 || d >= 10) {
                        imgData.data[outStart] = 80;
                        imgData.data[outStart + 1] = 80;
                        imgData.data[outStart + 2] = 80;
                        imgData.data[outStart + 3] = 255;
                    }
                    else {
                        imgData.data[outStart] = imgDataOG.data[start];
                        imgData.data[outStart + 1] = imgDataOG.data[start + 1];
                        imgData.data[outStart + 2] = imgDataOG.data[start + 2];
                        imgData.data[outStart + 3] = 255;
                    }
                }
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
    button.href = canvasOUT.toDataURL('image/png');
}

async function showWaitSpinner() {
    $('#spinnerModal').modal('show');
}
function hideWaitSpinner() {
    $('#spinnerModal').modal('hide');
}

function showInfoModal(title, body) {
    hideWaitSpinner();
    modalInfoTitle.innerHTML = title;
    modalInfoBody.innerHTML = body;
    $("#modalInfo").modal('show');
}