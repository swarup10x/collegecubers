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
    LoadLayoutOLD();
}

function updateText(obj, toAdd) {
    var tb = document.querySelector("#" + obj);
    tb.value = Number(tb.value) + toAdd;
    LoadLayoutOLD();
}

function checkRange(btn) {
    if (btn.value > btn.max) {
        showInfoModal("Warning", "Max value is " + btn.max);
        btn.value = btn.max;
    }
}

function initLayoutValuesOLD() {
    txtNumberXcubes.value = imgOriginal.width / 3.0;
    txtNumberXcubes.max = imgOriginal.width / 3.0;
    txtNumberYcubes.value = imgOriginal.height / 3.0;
    txtNumberYcubes.max = imgOriginal.height / 3.0;
    txtStartX.value = 1;
    txtStartX.max = imgOriginal.width / 3.0;
    txtStartY.value = 1;
    txtStartY.max = imgOriginal.height / 3.0;
}
function initLayoutValues() {
    console.log('calling new initLayoutValues')
    txtNumberXcubes.value = imgOriginal.width ;
    txtNumberXcubes.max = imgOriginal.width;
    txtNumberYcubes.value = imgOriginal.height ;
    txtNumberYcubes.max = imgOriginal.height ;
    txtStartX.value = 1;
    txtStartX.max = imgOriginal.width 
    txtStartY.value = 1;
    txtStartY.max = imgOriginal.height;
}

function LoadLayoutTry1() {
    console.log('calling new LoadLayout')
    if (imgOriginal.width == 0) {
        hideWaitSpinner();
        showInfoModal("Error", "There is no sessioned crop image. Go back to Crop page.")
    } else {
        divLayoutArea.innerHTML = "";

        var canvasOUT = document.createElement("canvas");
        canvasOUT.width = imgOriginal.width;
        canvasOUT.height = imgOriginal.height;
        var ctx = canvasOUT.getContext("2d");
        ctx.drawImage(imgOriginal, 0, 0);
        var imgData = ctx.getImageData(0, 0, imgOriginal.width, imgOriginal.height);

        for (var h = 0; h < imgOriginal.height; h++) {
            var row = document.createElement("div");
            row.className = "pixelRow";

            for (var w = 0; w < imgOriginal.width; w++) {
                var pixel = document.createElement("div");
                pixel.className = "pixel";

                var start = (imgOriginal.width * h + w) * 4;

                var thisColor = "#" + ("0" + imgData.data[start].toString(16)).slice(-2).toUpperCase() +
                    ("0" + imgData.data[start + 1].toString(16)).slice(-2).toUpperCase() +
                    ("0" + imgData.data[start + 2].toString(16)).slice(-2).toUpperCase();

                pixel.style.backgroundColor = thisColor;
                row.appendChild(pixel);
            }

            divLayoutArea.appendChild(row);
        }
    }
}

function LoadLayout() {
    if (imgOriginal.width == 0) {
        hideWaitSpinner();
        showInfoModal("Error", "There is no sessioned crop image. Go back to Crop page.")
    }
    else {
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

        //header
        var headerRow = document.createElement("div");
        headerRow.className = "cubeRow";
        //Empty Corner
        var headerCellCorner = document.createElement("div");
        headerCellCorner.className = "headerCell";
        headerCellCorner.innerHTML = "&nbsp;";
        headerRow.appendChild(headerCellCorner);

        for (x = StartX; x < StartX + NumberXcubes; x++) {
            var headerCell = document.createElement("div");
            headerCell.className = "headerCell";
            headerCell.innerHTML = x;
            headerRow.appendChild(headerCell);
        }
        divLayoutArea.appendChild(headerRow);

        for (h = (StartY - 1) * 3; h < ((StartY - 1) * 3) + (NumberYcubes * 3); h = h + 3) {
            var row = document.createElement("div");
            row.className = "cubeRow";

            //side Header
            var sideHeaderCell = document.createElement("div");
            sideHeaderCell.className = "headerCell";
            sideHeaderCell.innerHTML = (h / 3) + 1;
            row.appendChild(sideHeaderCell);

            for (w = (StartX - 1) * 3; w < ((StartX - 1) * 3) + (NumberXcubes * 3); w = w + 3) {
                var cube = document.createElement("div");
                cube.className = "cube";

                for (h0 = 0; h0 < 3; h0++) {
                    var cubeRow = document.createElement("div");
                    cubeRow.className = "cubeRow";
                    for (w0 = 0; w0 < 3; w0++) {
                        var tile = document.createElement("div");
                        tile.className = "tile";

                        var start = (imgOriginal.width * (h + h0) * 4) + (4 * (w + w0));

                        var thisColor = "#" + ("0" + imgData.data[start].toString(16)).slice(-2).toUpperCase()
                            + ("0" + imgData.data[start + 1].toString(16)).slice(-2).toUpperCase()
                            + ("0" + imgData.data[start + 2].toString(16)).slice(-2).toUpperCase();

                        tile.style.backgroundColor = thisColor;
                        cubeRow.appendChild(tile);
                    }
                    cube.appendChild(cubeRow);
                }

                row.appendChild(cube);
            }

            divLayoutArea.appendChild(row);
        }
    }
}

function LoadLayoutOLD() {
    if (imgOriginal.width == 0) {
        hideWaitSpinner();
        showInfoModal("Error", "There is no sessioned crop image. Go back to Crop page.")
    }
    else {
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

        //header
        var headerRow = document.createElement("div");
        headerRow.className = "cubeRow";
        //Empty Corner
        var headerCellCorner = document.createElement("div");
        headerCellCorner.className = "headerCell";
        headerCellCorner.innerHTML = "&nbsp;";
        headerRow.appendChild(headerCellCorner);

        for (x = StartX; x < StartX + NumberXcubes; x++) {
            var headerCell = document.createElement("div");
            headerCell.className = "headerCell";
            headerCell.innerHTML = x;
            headerRow.appendChild(headerCell);
        }
        divLayoutArea.appendChild(headerRow);

        for (h = (StartY - 1); h < ((StartY - 1)) + (NumberYcubes); h = h + 1) {
            var row = document.createElement("div");
            row.className = "cubeRow";

            //side Header
            var sideHeaderCell = document.createElement("div");
            sideHeaderCell.className = "headerCell";
            sideHeaderCell.innerHTML = (h) + 1;
            row.appendChild(sideHeaderCell);

            for (w = (StartX - 1); w < ((StartX - 1)) + (NumberXcubes); w = w + 1) {
                var cube = document.createElement("div");
                cube.className = "cube";

                for (h0 = 0; h0 < 1; h0++) {
                    var cubeRow = document.createElement("div");
                    cubeRow.className = "cubeRow";
                    for (w0 = 0; w0 < 1; w0++) {
                        var tile = document.createElement("div");
                        tile.className = "tile";

                        var start = (imgOriginal.width * (h + h0) * 1) + (1 * (w + w0));

                        var thisColor = "#" + ("0" + imgData.data[start].toString(16)).slice(-2).toUpperCase()
                            + ("0" + imgData.data[start + 1].toString(16)).slice(-2).toUpperCase()
                            + ("0" + imgData.data[start + 2].toString(16)).slice(-2).toUpperCase();

                        tile.style.backgroundColor = thisColor;
                        cubeRow.appendChild(tile);
                    }
                    cube.appendChild(cubeRow);
                }

                row.appendChild(cube);
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