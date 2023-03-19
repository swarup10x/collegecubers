var sliderValuesChanging = true;
var sliderColorConnect = [true, true, true, true, true, true];
var sliderColorValues = [43, 85, 128, 170, 213];
var colors = ["0353a0", "08a139", "e20613", "ee7d05", "ffe004", "FFFFFF"];
var maxNumberOfColors = 20;
var zoomValue;
var createSliderLargeFirstUpdate = true;
var AutoSaveInitial = true;

function init(){
    console.log('calling adjust init')
    imgOriginal.src=""
    let imageDataUrl = sessionStorage.getItem('Adjust')
    if (!imageDataUrl) imageDataUrl = sessionStorage.getItem('Crop')
    if (!imageDataUrl) imageDataUrl = sessionStorage.getItem('OG')
    if (imageDataUrl){
        console.log('setting adjust load image')
        imgOriginal.src = imageDataUrl
        console.log('imgOriginal.src',imgOriginal.src,imgOriginal.src.width)
    } 

    
    console.log(imgOriginal.src)
    console.log(imageDataUrl)
    imgOriginal.onload = function () {
        console.log('imgOriginal onload')
        AdjustByShade();
    }
}

document.addEventListener('DOMContentLoaded', function () {

    console.log('Adjust, dom contentloaded')

init()
   


    setColorsIfSaved();
    setStyleColors();
    createSliderColor();
    createSliderLarge();
    createSliderZoom(450 / imgOriginal.height);
    addColorsToColorDiv();

    sliderValuesChanging = false;
    AdjustByShade();

    setInterval(setSessionImageAdjust, 5000);

}, false);



//-----------------------------------------------------------
//Functions
//-----------------------------------------------------------
function setColorsIfSaved() {
    let foundColors=JSON.parse(sessionStorage.getItem('colors'));
    let foundSliderColorValues=JSON.parse(sessionStorage.getItem('sliderColorValues'));
    if (foundColors && foundSliderColorValues) {
        sliderColorValues = foundSliderColorValues;
        colors = foundColors;

        sliderColorConnect = [];
        for (x = 0; x < colors.length; x++)
            sliderColorConnect.push(true);
    }
    else
        inputAdjustColors.value = colors.toString();
}

function setSliderColorValues(c) {
    sliderColorValues = c.split(',');
}
function saveColors(){
    var pid=sessionStorage.getItem('openedProject')

   if(user){
    fetch(`/Identity/Account/Project/Updatedata?projectid=${pid}`, {
        method: "POST",
        body: JSON.stringify({sliderColorValues,colors}),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error(error);
    });
   }

    sessionStorage.setItem('sliderColorValues',JSON.stringify(sliderColorValues))
    sessionStorage.setItem('colors',JSON.stringify(colors))
   
}
function setSessionImageAdjust() {
    if (autoSaveDirty < 1) {
        saveColors()
        imageSaveToServer(imgAdjust, 'Adjust', "AdjustPage")
        
        return false;
    }
}

function AdjustByShade () {
    var slashedSource=imgOriginal.src.split('http://localhost:3000/Adjust/')[1]
    if (slashedSource != "") {
        console.log('slashedSource',imgOriginal.src)
        var canvasOUT = document.createElement("canvas");
        canvasOUT.width = imgOriginal.width;
        canvasOUT.height = imgOriginal.height;
        console.log('canvasOUT.height',canvasOUT.height)
        var ctx = canvasOUT.getContext("2d");
        ctx.drawImage(imgOriginal, 0, 0);
        var imgData = ctx.getImageData(0, 0, imgOriginal.width, imgOriginal.height);
        for (var i = 0; i < imgData.data.length; i += 4) {
            var colorIndex_AvgRGB = Math.ceil(1.0 * (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3);

            var thisColor = getPixelColorByShade(colorIndex_AvgRGB);
            imgData.data[i] = parseInt("0x" + thisColor.substring(0, 2));
            imgData.data[i + 1] = parseInt("0x" + thisColor.substring(2, 4));
            imgData.data[i + 2] = parseInt("0x" + thisColor.substring(4, 6));
            imgData.data[i + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        imgAdjust.src = canvasOUT.toDataURL("image/png");

        autoSaveDirty = 0;
        updateAutoSavedLabel();

        imgAdjust.onload = function () {
            if (AutoSaveInitial) {
                setSessionImageAdjust();
                AutoSaveInitial = false;
            }
        }
    }
}

function getPixelColorByShade(colorIndex) {
    for (x = 0; x < sliderColorValues.length; x++) {
        if (colorIndex < sliderColorValues[x])
            return colors[x];
    }
    return colors[colors.length - 1];
}

function addColor() {
    colors.push("000000");
    inputAdjustColors.value = colors.toString();
    var newPosition = 255 - ((255 - sliderColorValues[sliderColorValues.length - 1]) / 2.0);
    sliderColorValues.push(newPosition);
    sliderColorConnect.push(true);

    setStyleColors();
    sliderColor.noUiSlider.destroy();
    createSliderColor();
    divColors.innerHTML = "";
    addColorsToColorDiv();

    if (colors.length >= maxNumberOfColors) {
        divAddColor.style.display = "none";
        divMaxColor.innerHTML = "Max number of colors reached: " + maxNumberOfColors;
    }
}
function removeColor(x) {
    if (colors.length == 2) {
        alert("Must have at least 2 colors, cannot delete.");
    }
    else {
        colors.splice(x, 1);
        sliderColorValues.splice((x == sliderColorValues.length ? x - 1 : x), 1);
        sliderColorConnect.splice(x, 1);

        setStyleColors();
        sliderColor.noUiSlider.destroy();
        createSliderColor();
        divColors.innerHTML = "";
        addColorsToColorDiv();

        if (colors.length < maxNumberOfColors) {
            divAddColor.style.display = "block";
            divMaxColor.innerHTML = "";
        }

        inputAdjustColors.value = colors.toString();
    }
}

function setStyleColors() {
    var styleColors = document.querySelector('#styleColors');
    styleColors.innerHTML = "";
    for (x = 0; x < colors.length; x++) {
        styleColors.innerHTML = styleColors.innerHTML + ' .c-' + x + '-color { background: #' + colors[x] + '; }';
    }
}

function addDivColor(x) {
    var divOuter = document.createElement("div");
    divOuter.className = "colorPicker";

    var del = document.createElement("button");
    del.className = "btn btn-outline-danger btn-sm px-1 py-0 mr-1"
    del.innerHTML = "<i class='fas fa-trash-alt'></i>";
    del.onclick = function () { removeColor(x); };

    var div0 = document.createElement("div");
    div0.appendChild(del);
    divOuter.appendChild(div0);

    var moveDown = document.createElement("button");
    moveDown.className = "btn btn-outline-secondary btn-sm px-1 py-0"
    moveDown.innerHTML = "<i class='fas fa-arrow-down'></i>";
    moveDown.onclick = function () { moveColors(x, 1) };
    if (x == colors.length - 1) moveDown.style.visibility = "hidden";

    var div2 = document.createElement("div");
    div2.appendChild(moveDown);
    divOuter.appendChild(div2);

    var input = document.createElement("input");
    input.type = "color";
    input.id = "input_colors_" + x;
    input.value = "#" + colors[x];
    input.title = "Click to change color."
    input.addEventListener("change", watchColorPicker, false);

    var div1 = document.createElement("div");
    div1.appendChild(input);
    divOuter.appendChild(div1);

    var moveUp = document.createElement("button");
    moveUp.className = "btn btn-outline-secondary btn-sm px-1 py-0"
    moveUp.innerHTML = "<i class='fas fa-arrow-up mr-0'></i>";
    moveUp.onclick = function () { moveColors(x, -1) };
    if (x == 0) moveUp.style.visibility = "hidden";

    var div3 = document.createElement("div");
    div3.appendChild(moveUp);
    divOuter.appendChild(div3);

    divColors.appendChild(divOuter);
}

function moveColors(x, amountToAdd) {
    sliderValuesChanging = false;
    [colors[x], colors[x + amountToAdd]] = [colors[x + amountToAdd], colors[x]];
    setStyleColors();
    sliderColor.noUiSlider.destroy();
    createSliderColor();
    divColors.innerHTML = "";
    addColorsToColorDiv();

    inputAdjustColors.value = colors.toString();

    return false;
}

function watchColorPicker(event) {
    var position = event.target.id.replace("input_colors_", "")
    colors[position] = event.target.value.replace("#", "");
    setStyleColors();
    AdjustByShade();
}

function createSliderColor() {
    noUiSlider.create(sliderColor, {
        start: sliderColorValues,
        connect: sliderColorConnect,
        range: {
            'min': [0],
            'max': [256]
        }
    });

    var connect = sliderColor.querySelectorAll('.noUi-connect');
    for (var i = 0; i < connect.length; i++) {
        connect[i].classList.add('c-' + i + '-color');
    }

    sliderColor.noUiSlider.on('update', function (values) {
        sliderColorValues = values;
        inputAdjustSliderColorValues.value = values.toString();
        if (!sliderValuesChanging) AdjustByShade();
    });
}

function createSliderLarge(a) {
    noUiSlider.create(sliderColorLarge, {
        range: {
            min: 10,
            max: 60
        },
        start: [45]
    });

    sliderColorLarge.noUiSlider.on('update', function (value) {
        if (createSliderLargeFirstUpdate)
            createSliderLargeFirstUpdate = false
        else {
            sliderValuesChanging = true;

            for (x = 0; x < sliderColorValues.length; x++) {
                sliderColor.noUiSlider.setHandle(x, value * (x + 1));
            }

            AdjustByShade();
            sliderValuesChanging = false;
        }
    });
}

function createSliderZoom(zoomStart) {
    noUiSlider.create(sliderZoom, {
        range: {
            min: 1,
            max: 10
        },
        start: [zoomStart]
    });

    sliderZoom.noUiSlider.on('update', function (value) {
        zoomValue = value;
        imgAdjust.height = imgOriginal.clientHeight * zoomValue;
    });
}

function addColorsToColorDiv() {
    for (x = 0; x < colors.length; x++) {
        addDivColor(x);
    }
}