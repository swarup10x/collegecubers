const style = document.documentElement.style;

document.addEventListener('DOMContentLoaded', function () {
    imgPaint.src= ""
    let imageDataUrl = sessionStorage.getItem('Paint')
    if (!imageDataUrl) imageDataUrl = sessionStorage.getItem('Adjust')
    imgCrop.src = sessionStorage.getItem('Crop')
    imgOriginal.src= sessionStorage.getItem('OG')??""
    if (imageDataUrl) imgPaint.src=imageDataUrl;

    createSliderZoom();

    if (imgPaint.src != "") {
        radioPaint.click();
    }
    else {
        radioPaint.disabled = true;
        radioCrop.click();
    }
}, false);

//-----------------------------------------------------------
//Functions
//-----------------------------------------------------------

function toggleImageFrom(rb) {
    imgOriginal.src = document.getElementById("img" + rb.value).src;
    if (imgOriginal.width == 0) return;
    if (imgOriginal.naturalWidth * imgOriginal.naturalHeight / 9 > MaxNumberOfCubesForPortrait) {
        showInfoModal("Warning:", "Max number of cubes is <strong>" + MaxNumberOfCubesForPortrait + "</strong>. Go to the CROP page and scale image.");
        return;
    }
    initLayoutValues();
    LoadLayout();
}

function updateText(obj, toAdd) {
    var tb = document.querySelector("#" + obj);
    tb.value = Number(tb.value) + toAdd;
    LoadLayout();
}

function checkRange(btn) {
    if (btn.value > btn.max) {
        showInfoModal("Warning", "Max value is " + btn.max);
        btn.value = btn.max;
    }
}

function initLayoutValues() {
    txtNumberXcubes.value = imgOriginal.width;
    txtNumberXcubes.max = imgOriginal.width;
    txtNumberYcubes.value = imgOriginal.height;
    txtNumberYcubes.max = imgOriginal.height;
    txtStartX.value = 1;
    txtStartX.max = imgOriginal.width;
    txtStartY.value = 1;
    txtStartY.max = imgOriginal.height;
}

function LoadLayout() {
    if (imgOriginal.width == 0) {
        hideWaitSpinner();
        showInfoModal("Error", "There is no sessioned crop image. Go back to Crop page.")
    } else {
        divLayoutArea.innerHTML = "";

        var StartX = Number(document.querySelector('#txtStartX').value);
        var StartY = Number(document.querySelector('#txtStartY').value);
        var NumberXcubes = Number(document.querySelector('#txtNumberXcubes').value);
        var NumberYcubes = Number(document.querySelector('#txtNumberYcubes').value);
        if (StartX + NumberXcubes - 1 > txtNumberXcubes.max) NumberXcubes = txtNumberXcubes.max - StartX + 1;
        if (StartY + NumberYcubes - 1 > txtNumberYcubes.max) NumberYcubes = txtNumberYcubes.max - StartY + 1;

        var canvasOUT = document.createElement("canvas");
        canvasOUT.width = imgOriginal.width;
        canvasOUT.height = imgOriginal.height;
        var ctx = canvasOUT.getContext("2d");
        ctx.drawImage(imgOriginal, 0, 0);
        var imgData = ctx.getImageData(0, 0, imgOriginal.width, imgOriginal.height);

        for (h = StartY - 1; h < StartY + NumberYcubes - 1; h++) {
            var row = document.createElement("div");
            row.className = "cubeRow";

            for (w = StartX - 1; w < StartX + NumberXcubes - 1; w++) {
                var block = document.createElement("div");
                block.className = "cube";

                var tile = document.createElement("div");
                tile.className = "tile";

                var start = (imgOriginal.width * h + w) * 4;

                var thisColor = "#" + ("0" + imgData.data[start].toString(16)).slice(-2).toUpperCase() +
                                ("0" + imgData.data[start + 1].toString(16)).slice(-2).toUpperCase() +
                                ("0" + imgData.data[start + 2].toString(16)).slice(-2).toUpperCase();

                tile.style.backgroundColor = thisColor;
                block.appendChild(tile);
                row.appendChild(block);
            }

            divLayoutArea.appendChild(row);
        }
    }
}


function createSliderZoom() {
    noUiSlider.create(sliderZoom, {
        range: {
            min: 5,
            max: 30
        },
        step: 1,
        start: [15]
    });

    sliderZoom.noUiSlider.on('update', function (value) {
        style.setProperty('--tileHW', value + "px");
    });
}