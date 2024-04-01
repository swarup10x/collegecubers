class Color {
    constructor(HexColor, TotalShade) {
        this.hexColor = HexColor;
        this.totalShade = TotalShade;
    }
}
class PixelChange {
    constructor(X, Y, OgColor, NewColor) {
        this.x = X;
        this.y = Y;
        this.ogColor = OgColor;
        this.newColor = NewColor;
    }
}

var undo = [], redo = [];
var colors = [];
var maxNumberOfColors = 20;
var paintingColor;
const style = document.documentElement.style;
var leftMouseButtonOnlyDown = false;
var canvasOUT = document.querySelector("#canvas"),
    ctx, imgData;

showWaitSpinner();
$(document).ready(function () {

    let imageDataUrl = sessionStorage.getItem('Adjust')
    if (!imageDataUrl) imageDataUrl = sessionStorage.getItem('Crop')
    if (!imageDataUrl) imageDataUrl = sessionStorage.getItem('OG')
     imgPainted.src = imageDataUrl??"";
    console.log(imgPainted.src)
    console.log(imageDataUrl)

    if (imgPainted.naturalWidth * imgPainted.naturalHeight / 9 > MaxNumberOfCubesForPortrait) {
        showMaxNumberOfCubesWarnging();
    }
    else {
        Init();
    }
    createOpacityZoom();
    createSliderZoomBlender(500 / imgBlenderPainted.height);
    createSliderZoomPainting();
    updateUndoRedoEnabled();

    document.body.onmousedown = setLeftButtonState;
    document.body.onmousemove = setLeftButtonState;
    document.body.onmouseup = setLeftButtonState;

    setInterval(setSessionImagePaintPage, 5000);
}, false);

//-----------------------------------------------------------
//Functions
//-----------------------------------------------------------
function openFromSession(sessionName) {
    let imageDataUrl = sessionStorage.getItem(sessionName)
    if (!imageDataUrl) {
        hideWaitSpinner();
        showInfoModal("Error", "There is no sessioned crop image. Go back to Crop page.")
    }
    else {
        var img = document.createElement("img");
        img.src = imageDataUrl;
        img.onload = function () {
            if (img.naturalWidth * img.naturalHeight / 9 > MaxNumberOfCubesForPortrait) {
                showMaxNumberOfCubesWarnging();
                return;
            }
            if (checkColorsVsMax(img, imageDataUrl)) {
                imgPainted.src = imageDataUrl;
                imgPainted.onload = function () {
                    Init();
                }
            }
        };
    }
    fetch('/Helpers/ImageHelper?sessionName=' + sessionName + '&handler=Session', {
        method: 'get',
    })
        .then(
            function (response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' +
                        response.status);
                    return;
                }

                response.json().then(function (data) {
                    if (data == null) {
                        hideWaitSpinner();
                        showInfoModal("Error", "There is no sessioned crop image. Go back to Crop page.")
                    }
                    else {
                        var img = document.createElement("img");
                        img.src = data;
                        img.onload = function () {
                            if (img.naturalWidth * img.naturalHeight / 9 > MaxNumberOfCubesForPortrait) {
                                showMaxNumberOfCubesWarnging();
                                return;
                            }
                            if (checkColorsVsMax(img, data)) {
                                imgPainted.src = data;
                                imgPainted.onload = function () {
                                    Init();
                                }
                            }
                        };
                    }
                });
            }
        ).catch((error) => {
            showInfoModal("Error:", "There was a network error attempting to open from Session.");
            hideWaitSpinner();
            console.error('Error:', error);
        });
}

function showMaxNumberOfCubesWarnging() {
    divBlenderArea.style.display = "none";
    showInfoModal("Warning:", "Max number of cubes is <strong>" + MaxNumberOfCubesForPortrait + "</strong>. Go to the CROP page and scale image.");
}

async function setSessionImagePaintPage() {
    if (autoSaveDirty < 1) {
        imageSaveToServer(imgBlenderPainted, 'Paint', "PaintPage")

        return false;
    }
}

function setLeftButtonState(e) {
    leftMouseButtonOnlyDown = e.buttons === undefined
        ? e.which === 1
        : e.buttons === 1;
}
let retry=0
function Init() {
    var slashedSource=imgPainted.src.split('http://localhost:3000/Paint/')[1]
    if ( slashedSource!= "") {
        console.log(imgPainted.src)
        canvasOUT.width = imgPainted.width;
        canvasOUT.height = imgPainted.height;
        try {
            
            ctx = canvasOUT.getContext("2d");
            ctx.drawImage(imgPainted, 0, 0);
            imgData = ctx.getImageData(0, 0, imgPainted.width, imgPainted.height);
            imgBlenderPainted.src = canvasOUT.toDataURL("image/png");
            imgBlenderPainted.onload = function () {
                updateCanvas();
                divBlenderArea.style.display = "block";
                btnAddThisColor.style.display = "block";
                inputColorToAdd.style.display = "block";
                divMaxColor.innerHTML = "";
                imgBlenderPainted.onload = "";
            }
        } catch (error) {
            console.log('error')
            if(retry<1){
                retry++
                setTimeout(Init, 2500);
            }else{
                hideWaitSpinner();
            }
        }

        
    }
    else {
        hideWaitSpinner();
    }
}

function checkColorsVsMax(img) {
    var colorsCounter = [];

    var canvasTemp = document.createElement("canvas");
    canvasTemp.width = img.width;
    canvasTemp.height = img.height;
    var ctxTemp = canvasTemp.getContext("2d");
    ctxTemp.drawImage(img, 0, 0);
    var imgDataTemp = ctxTemp.getImageData(0, 0, img.width, img.height);


    for (h = 0; h < img.height; h++) {
        for (w = 0; w < img.width; w++) {
            var start = (img.width * h * 4) + (4 * w);
            var thisColor = "#" + ("0" + imgDataTemp.data[start].toString(16)).slice(-2).toUpperCase()
                + ("0" + imgDataTemp.data[start + 1].toString(16)).slice(-2).toUpperCase()
                + ("0" + imgDataTemp.data[start + 2].toString(16)).slice(-2).toUpperCase();

            thisColorColor = new Color(thisColor.substring(1), imgDataTemp.data[start] + imgDataTemp.data[start + 1] + imgDataTemp.data[start + 2]);

            if (colorsCounter.filter(function (col) { return col.hexColor === thisColorColor.hexColor }).length == 0) {
                colorsCounter.push(thisColorColor);
                if (colorsCounter.length > maxNumberOfColors) {
                    showInfoModal("Warning", "Max number of colors reached: <strong>" + maxNumberOfColors + "</strong>. Perhaps you are trying to load an image that hasn't been adjusted.");
                    return false;
                }
            }
        }
    }
    return true;
}
var colorPixels=[]

function replacePixelHolders(colorPixels) {
    var pixelHolderWrapper = document.getElementById("pixel-holder-wrapper");
    pixelHolderWrapper.innerHTML = "";
  
    for (var i = 0; i < colorPixels.length; i++) {
      var pixel = colorPixels[i];
  
      var divPixelHolder = document.createElement("div");
      divPixelHolder.className = "pixel-holders";
  
      var spanColor = document.createElement("span");
      spanColor.style.width = "10px";
      spanColor.style.height = "10px";
      spanColor.style.backgroundColor = pixel.tag;
      spanColor.className = "pixel-holder-color";
  
      var spanCount = document.createElement("span");
      spanCount.className = "pixel-holder-count";
      spanCount.textContent = pixel.pixels;
  
      divPixelHolder.appendChild(spanColor);
      divPixelHolder.appendChild(spanCount);
  
      pixelHolderWrapper.appendChild(divPixelHolder);
    }
  }
  

function updateCanvas() {
    
    colors = [];
    divPaintArea.innerHTML = "";
    divColors.innerHTML = "";
    console.log(colors)
    for (h = 0; h < imgPainted.height; h++) {
        var row = document.createElement("div");
        row.className = "cubeRow";

        for (w = 0; w < imgPainted.width; w++) {
            var start = (imgPainted.width * h * 4) + (4 * w);
            var thisColor = "#" + ("0" + imgData.data[start].toString(16)).slice(-2).toUpperCase()
                + ("0" + imgData.data[start + 1].toString(16)).slice(-2).toUpperCase()
                + ("0" + imgData.data[start + 2].toString(16)).slice(-2).toUpperCase();

            var div = document.createElement("div");
            div.id = "divPaint_" + w + "_" + h;
            div.className = "buckets";
            div.style.backgroundColor = thisColor;
            let cpItem=colorPixels.find((e)=>e.tag===thisColor)
            if(cpItem){
                let cIndex= colorPixels.indexOf(cpItem)
                colorPixels[cIndex].pixels++
            }else{
                colorPixels.push({tag:thisColor,pixels:1})
            }
           

            div.addEventListener("mousemove", function () {
                if (leftMouseButtonOnlyDown) performPaint(this, true, paintingColor);
            });
            div.addEventListener("mousedown", function () {
                performPaint(this, true, paintingColor);
            });
            row.appendChild(div);

            thisColorColor = new Color(thisColor.substring(1), imgData.data[start] + imgData.data[start + 1] + imgData.data[start + 2]);

            if (colors.filter(function (col) { return col.hexColor === thisColorColor.hexColor }).length == 0) {
                colors.push(thisColorColor);
                if (colors.length > maxNumberOfColors) {
                    colors = [];
                    showInfoModal("Warning", "Max number of colors reached: <strong>" + maxNumberOfColors + "</strong>. Perhaps you are trying to load an image that hasn't been adjusted.");
                    return;
                }
            }
        }

        divPaintArea.appendChild(row);
    }

    console.log('colorPixels',colorPixels)
    replacePixelHolders(colorPixels)
    colors.sort((a, b) => (a.totalShade < b.totalShade) ? 1 : -1);

    addColorsToColorDiv();

    autoSaveDirty = 0;
    setSessionImagePaintPage();

    hideWaitSpinner();
}

function undoPaint() {
    let pc = undo.pop();
    redo.push(pc);
    var obj = document.getElementById("divPaint_" + pc.x + "_" + pc.y);
    performPaint(obj, false, pc.ogColor);
}
function redoPaint() {
    let pc = redo.pop();
    undo.push(pc);
    var obj = document.getElementById("divPaint_" + pc.x + "_" + pc.y);
    performPaint(obj, false, pc.newColor);
}
function performPaint(obj, fromClick, colToPaint) {
    if (obj.style.backgroundColor != colToPaint) {
        let id = obj.id.split("_");
        if (fromClick) {
            redo = [];
            undo.push(new PixelChange(Number(id[1]), Number(id[2]), obj.style.backgroundColor, colToPaint));
        }
        obj.style.backgroundColor = colToPaint;
        var start = (imgPainted.width * id[2] * 4) + (4 * id[1]);

        var paintingColorArray = colToPaint.replace("rgb(", "").replace(" ", "").replace(")", "").split(",");
        imgData.data[start] = paintingColorArray[0];
        imgData.data[start + 1] = paintingColorArray[1];
        imgData.data[start + 2] = paintingColorArray[2];

        ctx.putImageData(imgData, 0, 0);
        imgBlenderPainted.src = canvasOUT.toDataURL("image/png");

        autoSaveDirty = 0;
        updateAutoSavedLabel();
        updateUndoRedoEnabled();

        var newColorPixels = [];
        for (let h = 0; h < imgPainted.height; h++) {
            for (let w = 0; w < imgPainted.width; w++) {
                var pixelDiv = document.getElementById("divPaint_" + w + "_" + h);
                var pixelColor = pixelDiv.style.backgroundColor;
                let cpItem = newColorPixels.find((e) => e.tag === pixelColor);
                if (cpItem) {
                    let cIndex = newColorPixels.indexOf(cpItem);
                    newColorPixels[cIndex].pixels++;
                } else {
                    newColorPixels.push({ tag: pixelColor, pixels: 1 });
                }
            }
        }
        colorPixels=newColorPixels;
        console.log('new color pixels',colorPixels)
        replacePixelHolders(colorPixels)
    }
}
function updateUndoRedoEnabled() {
    btnUndo.disabled = (undo.length == 0);
    btnRedo.disabled = (redo.length == 0);
}

function addDivColor(x, select) {
    var input = document.createElement("input");
    input.id = "radioPaintColor" + x;
    input.type = "radio";
    input.name = "radioPaintColor";
    input.style.backgroundColor = "#" + colors[x].hexColor;
    input.addEventListener("click", function () {
        paintingColor = this.style.backgroundColor;
    });
    divColors.appendChild(input);
    if (select) input.click();

    var label = document.createElement("label");
    label.htmlFor = "radioPaintColor" + x;
    label.innerHTML = "&nbsp;";
    label.style.backgroundColor = "#" + colors[x].hexColor;

    divColors.appendChild(label);

    if (colors.length >= maxNumberOfColors) {
        btnAddThisColor.style.display = "none";
        inputColorToAdd.style.display = "none";
        divMaxColor.innerHTML = "Max number of colors reached: " + maxNumberOfColors;
    }
}
function addColorsToColorDiv() {
    for (x = 0; x < colors.length; x++) {
        addDivColor(x, (x == 0));
    }
}

function addThisColor() {
    var col = new Color(inputColorToAdd.value.replace("#", ""), -1);
    colors.push(col);
    addDivColor(colors.length - 1, true);
}

function createSliderZoomPainting() {
    noUiSlider.create(sliderZoomPainting, {
        range: {
            min: 1,
            max: 30
        },
        step: 1,
        start: [10]
    });

    sliderZoomPainting.noUiSlider.on('update', function (value) {
        style.setProperty('--paintHW', value + "px");
    });
}

function createSliderZoomBlender(zoomStart) {
    noUiSlider.create(SliderZoomBlender, {
        range: {
            min: 1,
            max: 10
        },
        start: [zoomStart]
    });

    SliderZoomBlender.noUiSlider.on('update', function (value) {
        imgOriginal.height = imgPainted.clientHeight * value;
        imgBlenderPainted.height = imgPainted.clientHeight * value;
    });
}

function createOpacityZoom() {
    noUiSlider.create(sliderOpacityZoom, {
        range: {
            min: 0,
            max: 1
        },
        start: [0]
    });

    sliderOpacityZoom.noUiSlider.on('update', function (value) {
        style.setProperty('--opacity', value);
    });
}
