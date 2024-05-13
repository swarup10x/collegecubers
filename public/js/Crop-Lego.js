var numberOfLegosBeforeAutoScales = 50000*9;


function rescaleIfNeededLegos() {
    if (imgOriginal.naturalWidth * imgOriginal.naturalHeight > numberOfLegosBeforeAutoScales) {
        txtMaxNumLegos.value = numberOfLegosBeforeAutoScales;
        updateScaleNumOFLegos(true);
        scaleLego(numberOfLegosBeforeAutoScales, finishLoadPic);
        txtMaxNumLegos.value = 720;
        updateScaleNumOFLegos(false);
    }
    else
        finishLoadPic()
}
function rescaleIfNeededLegosWithoutReload() {
    if (imgOriginal.naturalWidth * imgOriginal.naturalHeight > numberOfLegosBeforeAutoScales) {
        txtMaxNumLegos.value = numberOfLegosBeforeAutoScales;
        updateScaleNumOFLegos(true);
        scaleLego(numberOfLegosBeforeAutoScales, ()=>{});
        txtMaxNumLegos.value = 720;
        updateScaleNumOFLegos(false);
    }

}



function cropAndScaleLegos() {
    console.log('calling cropAndScaleLegos()',scaleTotalLegos.innerText,lblTotalLegos.innerText)
    if (Number(scaleTotalLegos.innerText) >= Number(lblTotalLegos.innerText)) {
        showInfoModal("Warning - Cannot scale to larger size", "The current image is <strong>" + lblTotalLegos.innerText + "</strong> Legos, and you are trying to scale to <strong>" + scaleTotalLegos.innerText + "</strong>, but you must scale to a smaller number of legos.");
        return;
    }

    if (cropRect.w === undefined)
        scaleLego(txtMaxNumLegos.value, finishScale);
    else
        cropLego();
    sessionStorage.removeItem('Paint')
    sessionStorage.removeItem('Adjust')
}


function cropLego() {
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
        scaleLego(txtMaxNumLegos.value, finishScale);

    };
}







//--------scale----------
function updateScaleNumOFLegos(autoscaled) {
    if (!autoscaled && txtMaxNumLegos.value > 27000) {
        showInfoModal("Warning", "Max value is 3000");
        txtMaxNumLegos.value = 27000;
    }
    if (imgOriginal.width == 0)
        divScaleStatsLegos.style.visibility = "hidden";
    else {
        divScaleStatsLegos.style.visibility = "";
        if (cropRect.w == undefined) {
            var factor = 1.0 / (Math.sqrt( txtMaxNumLegos.value / (imgOriginal.width * imgOriginal.height)));
            var x = imgOriginal.width / factor ;
            var y = imgOriginal.height / factor ;
            setScaleWHLegos(x, y);
        }
        else {
            var factor = 1.0 / (Math.sqrt( txtMaxNumLegos.value / (cropRect.w * cropRect.h)));
            var x = cropRect.w / factor ;
            var y = cropRect.h / factor;
            setScaleWHLegos(x, y);
        }
    }
}

function setScaleWHLegos(x, y) {
    if (Math.round(x) * Math.round(y) <= Number(txtMaxNumLegos.value)) {
        scaleWidthLegos.innerText = Math.round(x);
        scaleHeightLegos.innerText = Math.round(y);
    }
    else if (x % 1 > y % 1) {
        scaleWidthLegos.innerText = Math.floor(y) * Math.round(x) <= Number(txtMaxNumLegos.value) ? Math.round(x) : Math.floor(x);
        scaleHeightLegos.innerText = Math.floor(y);
    }
    else {
        scaleHeightLegos.innerText = Math.floor(x) * Math.round(y) <= Number(txtMaxNumLegos.value) ? Math.round(y) : Math.floor(y);
        scaleWidthLegos.innerText = Math.floor(x);
    }

    scaleTotalLegos.innerText = scaleWidthLegos.innerText * scaleHeightLegos.innerText;
}

function scaleLego(maxNumLegos, callback) {
    var ogWidth = imgOriginal.width;
    var ogHeight = imgOriginal.height;
    var newWidth, newHeight;

    newWidth = Number(scaleWidthLegos.innerText) ;
    newHeight = Number(scaleHeightLegos.innerText);
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


function setOGstatsLegos() {
    if (imgOriginal.width > 0) {
        lblWidthPixels.innerText = imgOriginal.width;
        lblHeightPixels.innerText = imgOriginal.height;
        lblWidthLegos.innerText = Math.round(imgOriginal.width * 10) / 10;
        lblHeightLegos.innerText = Math.round(imgOriginal.height  * 10) / 10;
        lblTotalLegos.innerText = Math.round(imgOriginal.width  * imgOriginal.height * 10) / 10;
        divOGStats.style.visibility = "visible";
    }
    else
        divOGStats.style.visibility = "hidden";
}