var numberOfCubesBeforeAutoScales = 50000;





//-----------------------------------------------------------
//Functions
//-----------------------------------------------------------



function rescaleIfNeededCubes() {
    if (imgOriginal.naturalWidth * imgOriginal.naturalHeight / 9 > numberOfCubesBeforeAutoScales) {
        txtMaxNumCubes.value = numberOfCubesBeforeAutoScales;
        updateScaleNumOFCubes(true);
        scaleCubes(numberOfCubesBeforeAutoScales, finishLoadPic);
        txtMaxNumCubes.value = 720;
        updateScaleNumOFCubes(false);
    }
    else
        finishLoadPic()
}



function cropAndScaleCubes() {
    console.log('calling cropAndScaleCubes()',scaleTotalCubes.innerText,lblTotalCubes.innerText)
    if (Number(scaleTotalCubes.innerText) >= Number(lblTotalCubes.innerText)) {
        showInfoModal("Warning - Cannot scale to larger size", "The current image is <strong>" + lblTotalCubes.innerText + "</strong> Cubes, and you are trying to scale to <strong>" + scaleTotalCubes.innerText + "</strong>, but you must scale to a smaller number of cubes.");
        return;
    }

    if (cropRect.w === undefined)
        scaleCubes(txtMaxNumCubes.value, finishScale);
    else
        cropCube();
    sessionStorage.removeItem('Paint')
    sessionStorage.removeItem('Adjust')
}



function cropCube() {
    var canvasOG = document.createElement("canvas");
    canvasOG.width = imgOriginal.width;
    canvasOG.height = imgOriginal.height;
    var ctxOG = canvasOG.getContext("2d");
    ctxOG.drawImage(imgOriginal, 0, 0);
    var imgData = ctxOG.getImageData(0, 0, imgOriginal.width, imgOriginal.height);

    cropRectOriginal = {
        startX: cropRect.startX / zoomAmount,
        startY: cropRect.startY / zoomAmount,
        w: cropRect.w / zoomAmount,
        h: cropRect.h / zoomAmount
    }

    canvasImage.width = cropRectOriginal.w;
    canvasImage.height = cropRectOriginal.h;
    var ctxCropped = canvasImage.getContext("2d");
    var imgDataCropped = ctxCropped.getImageData(0, 0, cropRectOriginal.w, cropRectOriginal.h);

    var count = 0;
    for (h = cropRectOriginal.startY; h < cropRectOriginal.startY + cropRectOriginal.h; h++) {
        for (w = cropRectOriginal.startX; w < cropRectOriginal.startX + cropRectOriginal.w; w++) {
            var start = (imgOriginal.width * h * 4) + (4 * w);
            imgDataCropped.data[count] = imgData.data[start];
            imgDataCropped.data[count + 1] = imgData.data[start + 1];
            imgDataCropped.data[count + 2] = imgData.data[start + 2];
            imgDataCropped.data[count + 3] = imgData.data[start + 3];
            count = count + 4;
        }
    }

    ctxCropped.putImageData(imgDataCropped, 0, 0);
    imgOriginal.src = canvasImage.toDataURL("image/png");
    initCropArea();

    imgOriginal.onload = function () {
        initCropArea();
        scaleCubes(txtMaxNumCubes.value, finishScale);

    };
}



//--------scale----------
function updateScaleNumOFCubes(autoscaled) {
    if (!autoscaled && txtMaxNumCubes.value > 3000) {
        showInfoModal("Warning", "Max value is 3000");
        txtMaxNumCubes.value = 3000;
    }
    if (imgOriginal.width == 0)
        divScaleStatsCubes.style.visibility = "hidden";
    else {
        divScaleStatsCubes.style.visibility = "";
        if (cropRect.w == undefined) {
            var factor = 1.0 / (Math.sqrt(9.0 * txtMaxNumCubes.value / (imgOriginal.width * imgOriginal.height)));
            var x = imgOriginal.width / factor / 3;
            var y = imgOriginal.height / factor / 3;
            setScaleWHCubes(x, y);
        }
        else {
            var factor = 1.0 / (Math.sqrt(9.0 * txtMaxNumCubes.value / (cropRect.w * cropRect.h)));
            var x = cropRect.w / factor / 3;
            var y = cropRect.h / factor / 3;
            setScaleWHCubes(x, y);
        }
    }
}

function setScaleWHCubes(x, y) {
    if (Math.round(x) * Math.round(y) <= Number(txtMaxNumCubes.value)) {
        scaleWidthCubes.innerText = Math.round(x);
        scaleHeightCubes.innerText = Math.round(y);
    }
    else if (x % 1 > y % 1) {
        scaleWidthCubes.innerText = Math.floor(y) * Math.round(x) <= Number(txtMaxNumCubes.value) ? Math.round(x) : Math.floor(x);
        scaleHeightCubes.innerText = Math.floor(y);
    }
    else {
        scaleHeightCubes.innerText = Math.floor(x) * Math.round(y) <= Number(txtMaxNumCubes.value) ? Math.round(y) : Math.floor(y);
        scaleWidthCubes.innerText = Math.floor(x);
    }

    scaleTotalCubes.innerText = scaleWidthCubes.innerText * scaleHeightCubes.innerText;
}

function scaleCubes(maxNumCubes, callback) {
    var ogWidth = imgOriginal.width;
    var ogHeight = imgOriginal.height;
    var newWidth, newHeight;

    newWidth = Number(scaleWidthCubes.innerText) * 3;
    newHeight = Number(scaleHeightCubes.innerText) * 3;
    var xFactor = ogWidth / newWidth;
    var yFactor = ogHeight / newHeight;

    var canvasOG = document.createElement("canvas");
    canvasOG.width = imgOriginal.width;
    canvasOG.height = imgOriginal.height;
    var ctxOG = canvasOG.getContext("2d");
    ctxOG.drawImage(imgOriginal, 0, 0);
    var imgData = ctxOG.getImageData(0, 0, imgOriginal.width, imgOriginal.height);

    canvasImage.width = newWidth;
    canvasImage.height = newHeight;
    var ctxScaled = canvasImage.getContext("2d");
    var imgDataScaled = ctxScaled.getImageData(0, 0, newWidth, newHeight);

    var count = 0;
    for (var y = 0; y < newHeight; y++) {
        for (var x = 0; x < newWidth; x++) {
            var listRed = [];
            var listGreen = [];
            var listBlue = [];

            for (var xOld = Math.round(x * xFactor); xOld < Math.round((x + 1) * xFactor); xOld++) {
                for (var yOld = Math.round(y * yFactor); yOld < Math.round((y + 1) * yFactor); yOld++) {
                    if (xOld < ogWidth && yOld < ogHeight) {
                        var start = (imgOriginal.width * yOld * 4) + (4 * xOld);
                        if (imgData.data[start + 3] == 0) {
                            listRed.push(255);
                            listGreen.push(255);
                            listBlue.push(255);
                        }
                        else {
                            listRed.push(imgData.data[start]);
                            listGreen.push(imgData.data[start + 1]);
                            listBlue.push(imgData.data[start + 2]);
                        }
                    }
                }
            }

            imgDataScaled.data[count] = Math.round(listRed.reduce((a, b) => a + b, 0) / listRed.length);
            imgDataScaled.data[count + 1] = Math.round(listGreen.reduce((a, b) => a + b, 0) / listGreen.length);
            imgDataScaled.data[count + 2] = Math.round(listBlue.reduce((a, b) => a + b, 0) / listBlue.length);
            imgDataScaled.data[count + 3] = 255;
            count = count + 4;
        }
    }

    ctxScaled.putImageData(imgDataScaled, 0, 0);
    imgOriginal.src = canvasImage.toDataURL("image/png");
    initCropArea();

    imgOriginal.onload = function () {
        callback();
    };
}



function setOGstatsCubes() {
    if (imgOriginal.width > 0) {
        lblWidthPixels.innerText = imgOriginal.width;
        lblHeightPixels.innerText = imgOriginal.height;
        lblWidthCubes.innerText = Math.round(imgOriginal.width / 3 * 10) / 10;
        lblHeightCubes.innerText = Math.round(imgOriginal.height / 3 * 10) / 10;
        lblTotalCubes.innerText = Math.round(imgOriginal.width / 3 * imgOriginal.height / 3 * 10) / 10;
        divOGStats.style.visibility = "visible";
    }
    else
        divOGStats.style.visibility = "hidden";
}