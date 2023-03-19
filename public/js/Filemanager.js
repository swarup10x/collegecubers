async function handleProjectOpen(event, projectid) {
    event.preventDefault();
    const user = getUserCookie()

    // Get form data


    console.log(`projectid: ${projectid}`);

    clearSessionStorage()
    sessionStorage.setItem('openedProject', projectid)

    console.log('settingup session cache')


    await imageUrltoDataUrl(`/${user['_id']}/${projectid}/Crop.png`, 'Crop')
    await imageUrltoDataUrl(`/${user['_id']}/${projectid}/Adjust.png`, 'Adjust')
    await imageUrltoDataUrl(`/${user['_id']}/${projectid}/Paint.png`, 'Paint')
    
    fetch(`/${user['_id']}/${projectid}/data.json`)
        .then(response => response.json())
        .then(data => {
            if (data.sliderColorValues) {
                sessionStorage.setItem('sliderColorValues', JSON.stringify(data.sliderColorValues))
            }
            if (data.colors) {
                sessionStorage.setItem('colors', JSON.stringify(data.colors))
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
        window.location.replace('/Paint');

}

document.addEventListener('DOMContentLoaded', async function () {
    const user = getUserCookie()
    console.log('Filemanger, dom contentloaded')
    //fetch from '/Identity/Account'
    try {

        let response = await fetch('/Identity/Account/Projects')
        let data = await response.json()
        var cardElement = document.getElementById('project-cards')
        var diskSizeElement = document.getElementById('disk-size')
        diskSizeElement.innerText = data.disksize
        document.querySelector('.bg-success').style.width = `${100 - data.disksize * 2}%`
        document.querySelector('.bg-danger').style.width = `${data.disksize * 2}%`

        data.projects.forEach(project => {
            cardElement.innerHTML = cardElement.innerHTML + makeProjectCard(user['_id'], project.id, project.lastModified, project.size, project.name)
        });
    } catch (error) {
        console.error(error)
    }

}, false);


async function imageUrltoDataUrl(imageUrl, titleKey) {
    try {
        const response = await fetch(imageUrl);
        if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = function () {
                const dataUrl = reader.result;
                sessionStorage.setItem(titleKey, dataUrl);

            }
        } else {
            console.log('Failed to load image from ' + imageUrl);
        }
    } catch (error) {
        console.log('Failed to load image from ' + imageUrl + ': ' + error.message);

    }
}


function makeProjectCard(userid, projectid, lastModified, sizemb, projectName) {
    return `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title">${projectName}</h5>
                    <div class="row no-gutters">
                        <div class="col-6">
                            <img src="/${userid}/${projectid}/Crop.png" class="card-img">
                        </div>
                        <div class="col-6">
                            <img src="/${userid}/${projectid}/Paint.png" class="card-img">
                        </div>
                    </div>
                </div>
                <div class="card-body text-center d-flex flex-wrap justify-content-center">
                    <div class="mr-1">
                        <form onsubmit="handleProjectOpen(event,${projectid})">
                            <button class="btn btn-success">Open<br />Project</button>
                            <input type="hidden" value="${projectid}" id="directoryOfProject" name="directoryOfProject" />
                        </form>
                    </div>
                    <div class="mr-1">
                        <button type="button" class="btn btn-info" data-toggle="modal" data-target="#renameModal" data-whatever="31bd8843-02ac-430c-a6bb-bece143e67a8" onclick="setRenameValues('${projectName}', '${projectid}');">Rename<br />Project</button>
                    </div>
                    <div>
                        <form method="post" action="/Identity/Account/Manage/FileManager?handler=DeleteProject">
                            <button class="btn btn-danger">Delete<br />Project</button>
                            <input type="hidden" value="${projectid}" id="directoryOfProject" name="directoryOfProject" />
                        </form>    
                    </div>
                </div>
                <div class="card-footer">
                    <div><small class="text-muted"><strong>Date Modified:</strong> ${lastModified}</small></div>
                    <div><small class="text-muted"><strong>Size:</strong> ${sizemb} MB</small></div>
                </div>
            </div>
`
}

