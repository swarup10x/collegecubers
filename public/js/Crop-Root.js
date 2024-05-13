var canvasCropArea = document.getElementById('canvasCropArea'),
    cropCtx = canvasCropArea.getContext('2d'),
    cropRect = {},
    drag = false,
    mouseX,
    mouseY,
    closeEnough = 10,
    dragTL = dragBL = dragTR = dragBR = false;
var zoomAmount = 1;


function init(){
    imgOriginal.src=""
    let imageDataUrl = sessionStorage.getItem('Crop')
    if (!imageDataUrl) imageDataUrl = sessionStorage.getItem('OG')

    if (imageDataUrl){
        imgOriginal.src = imageDataUrl
        console.log('crop src loaded')
        imgOriginal.onload = function () {
            console.log('imgOriginal onload')
 
            LoadLayout()
        }
    } 
}


document.addEventListener('DOMContentLoaded', function () {
    console.log('Crop, dom contentloaded')
    init()
    createSliderZoom();
}, false);

//-----------------------------------------------------------
//Functions
//-----------------------------------------------------------

document.getElementById('file-selector').addEventListener('input', event => {
    showWaitSpinner();
    const file = event.target.files[0];
    if (file == null) return;
    if (!file.type) {
        hideWaitSpinner();
        alert('Error: The File.type property does not appear to be supported on this browser.');
        return;
    }
    if (!file.type.match('image.*')) {
        hideWaitSpinner();
        alert('Error: The selected file does not appear to be an image.');
        return;
    }

    const reader = new FileReader();

    document.getElementById('file-selector').value = "";

    reader.onload = (function (theFile) {
        var image = new Image();
        image.src = theFile.target.result;

        image.onload = function () {
            imgOriginal.src = this.src;
            clearSessionStorage()
            var newprojectId= Date.now().toString()
            sessionStorage.setItem('openedProject',newprojectId)
            console.log('newprojectid',sessionStorage.getItem('openedProject'))
            rescaleIfNeededCubes();
            // rescaleIfNeededLegosWithoutReload();
    
        };
    });

    reader.addEventListener('load', event => { });
    reader.readAsDataURL(file);
});

function LoadLayout() {
    canvasImage.width = imgOriginal.width * zoomAmount;
    canvasImage.height = imgOriginal.height * zoomAmount;
    var ctx = canvasImage.getContext("2d");
    ctx.scale(zoomAmount, zoomAmount);
    ctx.drawImage(imgOriginal, 0, 0);
    updateScaleNumOFLegos(false);
    updateScaleNumOFCubes(false);
    setOGstats();
}

function createSliderZoom() {
    noUiSlider.create(sliderZoom, {
        range: {
            min: -5,
            max: 10
        },
        step: 1,
        start: [1]
    });

    sliderZoom.noUiSlider.on('update', function (value) {
        zoomAmount = value >= 1 ? value : 1 / ((-1 * value) + 2);
        LoadLayout();
        initCropArea();
    });
}


function initCropArea() {
    cropRect = {};
    canvasCropArea.addEventListener('mousedown', mouseDown, false);
    canvasCropArea.addEventListener('mouseup', mouseUp, false);
    canvasCropArea.addEventListener('mousemove', mouseMove, false);
    canvasCropArea.addEventListener('mouseout', mouseUp, false);
    canvasCropArea.width = canvasImage.width;
    canvasCropArea.height = canvasImage.height;
}

function mouseDown(e) {
    var rect = e.target.getBoundingClientRect();
    mouseX = e.pageX - rect.left;
    mouseY = e.pageY - rect.top;

    if (cropRect.w === undefined) {
        cropRect = {
            startX: getNearestSnap(mouseX),
            startY: getNearestSnap(mouseY),
            w: zoomAmount,
            h: zoomAmount
        }
        dragBR = true;
    }
    else if (checkCloseEnough(mouseX, cropRect.startX) && checkCloseEnough(mouseY, cropRect.startY))
        dragTL = true;
    else if (checkCloseEnough(mouseX, cropRect.startX + cropRect.w) && checkCloseEnough(mouseY, cropRect.startY))
        dragTR = true;
    else if (checkCloseEnough(mouseX, cropRect.startX) && checkCloseEnough(mouseY, cropRect.startY + cropRect.h))
        dragBL = true;
    else if (checkCloseEnough(mouseX, cropRect.startX + cropRect.w) && checkCloseEnough(mouseY, cropRect.startY + cropRect.h))
        dragBR = true;

    draw();
}


function checkCloseEnough(p1, p2) {
    return Math.abs(p1 - p2) < closeEnough;
}

function mouseUp() {
    dragTL = dragTR = dragBL = dragBR = false;
}

function mouseMove(e) {
    var rect = e.target.getBoundingClientRect();
    mouseX = e.pageX - rect.left;
    mouseY = e.pageY - rect.top;

    if (checkCloseEnough(mouseX, cropRect.startX) && checkCloseEnough(mouseY, cropRect.startY))
        this.style.cursor = "nwse-resize";
    else if (checkCloseEnough(mouseX, cropRect.startX + cropRect.w) && checkCloseEnough(mouseY, cropRect.startY))
        this.style.cursor = "nesw-resize";
    else if (checkCloseEnough(mouseX, cropRect.startX) && checkCloseEnough(mouseY, cropRect.startY + cropRect.h))
        this.style.cursor = "nesw-resize";
    else if (checkCloseEnough(mouseX, cropRect.startX + cropRect.w) && checkCloseEnough(mouseY, cropRect.startY + cropRect.h))
        this.style.cursor = "nwse-resize";
    else
        this.style.cursor = "default";

    var nearestSnapX = getNearestSnap(mouseX);
    var nearestSnapY = getNearestSnap(mouseY);

    if (dragTL) {
        if (cropRect.startX != nearestSnapX && cropRect.w + cropRect.startX - nearestSnapX >= zoomAmount) {
            cropRect.w += cropRect.startX - nearestSnapX;
            cropRect.startX = nearestSnapX;
        }
        if (cropRect.startY != nearestSnapY && cropRect.h + cropRect.startY - nearestSnapY >= zoomAmount) {
            cropRect.h += cropRect.startY - nearestSnapY;
            cropRect.startY = nearestSnapY;
        }
    } else if (dragTR) {
        if (cropRect.startX != nearestSnapX && nearestSnapX - cropRect.startX >= zoomAmount) {
            cropRect.w = nearestSnapX - cropRect.startX;
        }
        if (cropRect.startY != nearestSnapY && cropRect.h + cropRect.startY - nearestSnapY >= zoomAmount) {
            cropRect.h += cropRect.startY - nearestSnapY;
            cropRect.startY = nearestSnapY;
        }
    } else if (dragBL) {
        if (cropRect.startX != nearestSnapX && cropRect.w + cropRect.startX - nearestSnapX >= zoomAmount) {
            cropRect.w += cropRect.startX - nearestSnapX;
            cropRect.startX = nearestSnapX;
        }
        if (cropRect.startY != nearestSnapY && nearestSnapY - cropRect.startY >= zoomAmount) {
            cropRect.h = nearestSnapY - cropRect.startY;
        }
    } else if (dragBR) {
        if (cropRect.startX != nearestSnapX && nearestSnapX - cropRect.startX >= zoomAmount)
            cropRect.w = nearestSnapX - cropRect.startX;
        if (cropRect.startY != nearestSnapY && nearestSnapY - cropRect.startY >= zoomAmount)
            cropRect.h = nearestSnapY - cropRect.startY;

    }
    if (dragTL || dragTR || dragBL || dragBR) {
        updateScaleNumOFLegos(false);
        updateScaleNumOFCubes(false);
    }
    draw();
}


function finishLoadPic() {
    hideWaitSpinner();
    LoadLayout();
    initCropArea();
    imageSaveToServer(imgOriginal, 'OG', "CropPage");
}

function finishScale() {
    LoadLayout();
    imageSaveToServer(imgOriginal, 'Crop', "CropPage");
}


function getNearestSnap(x) {
    return Math.ceil(x / zoomAmount) * zoomAmount;
}

function draw() {
    cropCtx.clearRect(0, 0, canvasCropArea.width, canvasCropArea.height);
    cropCtx.fillStyle = "rgba(255, 255, 255,.5)";
    cropCtx.fillRect(cropRect.startX, cropRect.startY, cropRect.w, cropRect.h);
    cropCtx.strokeStyle = "rgb(0, 0, 255)";
    cropCtx.strokeRect(cropRect.startX, cropRect.startY, cropRect.w, cropRect.h);
}

function openFromURL() {
    showWaitSpinner();
    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = inputOpenFromURL.value;

    image.onload = function () {
        var canvasOG = document.createElement("canvas");
        canvasOG.width = this.width;
        canvasOG.height = this.height;openFrom
        var ctxOG = canvasOG.getContext("2d");
        ctxOG.drawImage(this, 0, 0);

        imgOriginal.src = canvasOG.toDataURL("image/png");

        imgOriginal.onload = function () {
            console.log('image crop file loading')
            clearSessionStorage()
            inputOpenFromURL.value = "";
            var newprojectId= Date.now().toString()
            sessionStorage.setItem('openedProject',newprojectId)
            console.log('newprojectid',sessionStorage.getItem('openedProject'))

            rescaleIfNeededCubes();
            rescaleIfNeededLegos();
   
        }
    };
    image.onerror = function () {
        hideWaitSpinner();
        alert("There was an error attempting to load this image.");
    }
}


function setOGstats(){
    setOGstatsCubes()
    setOGstatsLegos()
}




