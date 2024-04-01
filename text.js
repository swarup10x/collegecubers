newColorPixels = [];
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