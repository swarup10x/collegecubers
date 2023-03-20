var express = require('express')
const multer = require('multer');
var serveStatic = require('serve-static')
var path = require('path')
var fs = require('fs')
const bodyParser = require('body-parser');
const { MongoClient, ObjectID } = require('mongodb');
const cookieParser = require('cookie-parser');
var fsUtils = require("nodejs-fs-utils");

const upload = multer();



var app = express()

let url = 'mongodb://127.0.0.1:27017'
let dbName = 'collegecubers'
let client, db
MongoClient.connect(url).then((mclient) => {
    console.log('mongo connected')
    client = mclient
    db = client.db(dbName);
})

app.use(cookieParser());
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(serveStatic(path.join(__dirname, 'public')));
app.use(serveStatic(path.join(__dirname, 'Uploads')));

app.get('/Identity/Account/Projects', async (req, res) => {
    console.log('req received /Identity/Account/Projects');
    let user = JSON.parse(req.cookies.user)
    try {
        // Perform some action to retrieve data based on the accessToken
        var userprojectpath = `Uploads/${user['_id']}`

        let projecIds = fs.readdirSync(userprojectpath);
        let projects = []
        for (let i = 0; i < projecIds.length; i++) {
            const pid = projecIds[i];
            const data = fs.readFileSync(`${userprojectpath}/${pid}/data.json`, 'utf8');
            const jsonData = JSON.parse(data);
            console.log(jsonData);
            let stat = fs.statSync(`${userprojectpath}/${pid}`)
            const size = fsUtils.fsizeSync(`${userprojectpath}/${pid}`);
            projects.push({ id: pid, name: jsonData['name'], lastModified: stat.mtime, size: `${(size / 1000 / 1000).toFixed(2)}` })
        }

        const disksize = fsUtils.fsizeSync(`${userprojectpath}`);
        console.log('projects', projects)
        res.json({ projects: projects, disksize: `${(disksize / 1000 / 1000).toFixed(1)}` });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error finding user');
    }
    // ...
});



// app.post('/Admin/Users', async (req, res) => {
//     let username = req.query.username
//     let password = req.query.password

//     if(username===AdminUsername && password===AdminPassword){
//         let users=
//         res.json()
//     }
// });


app.post('/Identity/Account/Logout', async (req, res) => {
    console.log('Logging out user');
    res.clearCookie('user')
    // console.log(res.cookies.user)
    res.redirect('/Identity/Account/Logout')
});

app.post('/Identity/Account/Project/Updatedata', async (req, res) => {
    console.log('Updatedata called');
    try {
        var colordata = req.body
        let user = JSON.parse(req.cookies.user)
        let pid = req.query.projectid
        let filePath = `Uploads/${user['_id']}/${pid}/data.json`
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        colordata.name = jsonData.name
        fs.writeFileSync(filePath, JSON.stringify(colordata));
        // console.log(res.cookies.user)
        res.json({ success: true })
    } catch (error) {
        console.log(error);
        res.json({ success: false, error: error })

    }
});
app.post('/Identity/Account/Manage/FileManager', async (req, res) => {
    console.log('Logging out user');
    try {


        let user = JSON.parse(req.cookies.user)
        const pid = req.body.directoryOfProject
        if (req.query.handler === 'RenameProject') {
            //TODO
            const newname = req.body.newProjectName
            var filePath = `Uploads/${user['_id']}/${pid}/data.json`
            const data = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(data);
            jsonData.name = newname
            fs.writeFileSync(filePath, JSON.stringify(jsonData));

        } else if (req.query.handler === 'DeleteProject') {
            //TODO
            console.log('delete project called')
            fs.rmdirSync(`Uploads/${user['_id']}/${pid}`, { recursive: true, force: true })
        }
        // console.log(res.cookies.user)
        res.redirect('/Identity/Account/Manage/FileManager/')
    } catch (error) {
        console.log(error);
        res.status(500).send('Error :');
    }

});

app.get('/Identity/Account/Manage/VerifyEmail', async (req, res) => {
    var uid = req.query.uid
    try {
        const result = await db.collection('users').updateOne({ '_id': uid },
            { $set: { emailVerified: true } });
        res.send('<h2 style="text-align:center;color:green">Congrats! Your email was verified<h2>')

    } catch (error) {
        res.send('<h2 style="text-align:center;color:red">There was an error!<h2>')

    }
})

app.post('/Identity/Account/Register', async (req, res) => {
    var email = req.body['Input.Email'];
    var name = req.body['Input.Name'];
    var password = req.body['Input.Password'];

    var user = { name, email, password }
    user["emailVerified"] = false;

    console.log(user)

    // Perform validation and registration logic here
    try {
        
        let existinguser = await db.collection('users').findOne({ 'email': email });
        if(existinguser){
            res.status(500).send('User already exists');
        }
        const result = await db.collection('users').insertOne(user);
        console.log(result.insertedId)
        user['_id'] = result.insertedId.toString()
        fs.mkdirSync('Uploads/' + user['_id'])
        console.log('user directory created')

        console.log(user)

        res.cookie('user', JSON.stringify(user));
        var confirmationurl = req.hostname + `/Identity/Account/Manage/VerifyEmail?uid=${user['_id']}`
        console.log('//TODO: Send email with that url')
        res.redirect('/');

    } catch (error) {
        console.log(error);
        res.status(500).send('Error saving user');
    }
    // ...

});
app.post('/Identity/Account/Login', async (req, res) => {
    var email = req.body['Input.Email'];
    var password = req.body['Input.Password'];
    var rememberMe = req.body['Input.RememberMe'];

    console.log({ email, password })
    var cookieExpiryDays = rememberMe ? 7 : 1
    const collection = db.collection('users');

    try {
        user = await collection.findOne({ 'email': email, 'password': password });
        console.log('found user', user)
        res.cookie('user', JSON.stringify(user), {
            expires: new Date(Date.now() + cookieExpiryDays * 24 * 60 * 60 * 1000),
            // httpOnly: true
        });
        res.redirect('/Crop');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error finding user');
    }
});


app.get('/Identity/Account/Manage/Email/VerifyChange', async (req, res) => {
    var uid = req.query.uid
    var requestEmailChangeId = req.query.requestEmailChangeId
    try {
        var oldUser = await db.collection('users').findOne({ '_id': uid })
        if (oldUser.requestEmailChangeId === requestEmailChangeId) {

            const result = await db.collection('users').updateOne({ '_id': uid },
                { $set: { 'email': oldUser.requestEmailChangeId.newemail }, $unset: { 'requestEmailChangeId': 1 } });
            res.send('<h2 style="text-align:center;color:green">Congrats! Your email was changed<h2>')
        }

    } catch (error) {
        res.status(400).send('Invalid request');

    }
});

app.post('/Identity/Account/Manage/Email/ChangeRequest', async (req, res) => {
    try {
        console.log('rec received 2')
        console.log(req.body)
        var newemail = req.body['NewEmail']
        var email = req.body['Email']
        let user = JSON.parse(req.cookies.user)
        if (user.email === email) {
            console.log({ email, newemail })
            var requestEmailChangeId = Date.now().toString()
            const result = await db.collection('users').updateOne({ '_id': user['_id'] },
                { $set: { 'requestEmailChange': { 'id': requestEmailChangeId, 'newemail': newemail } } });
            var confirmationurl = req.hostname + `/Identity/Account/Manage/Email/VerifyChange?uid=${user['_id']}&requestEmailChangeId=${requestEmailChangeId}`
            console.log('confirmationurl', confirmationurl)

            console.log('//TODO: Send email with that url')
            res.json({ success: true })
        }
    } catch (error) {
        console.log(error)
        res.status(400).send('Invalid request');
    }

});
app.post('/Identity/Account/ForgotPassword/', async (req, res) => {
    try {
        console.log('rec received ForgotPassword')
        console.log(req.body)

        var email = req.body['Input.Email']


        console.log({ email })
        var requestResetPasswordId = Date.now().toString()
        const result = await db.collection('users').updateOne({ 'email': email },
            { $set: { 'requestResetPassword': { 'id': requestResetPasswordId } } });
        var confirmationurl = req.hostname + `/Identity/Account/ForgotPassword/VerifyChange?email=${email}&requestResetPasswordId=${requestResetPasswordId}`
        console.log('confirmationurl', confirmationurl)

        console.log('//TODO: Send email with that url')
        res.redirect('/Identity/Account/ForgotPasswordConfirmation')

    } catch (error) {
        console.log(error)
        res.status(400).send('Invalid request');
    }

});
app.get('/Identity/Account/ForgotPassword/VerifyChange', async (req, res) => {

    var requestResetPasswordId = req.query.requestResetPasswordId
    var email = req.query.email
    try {
        var oldUser = await db.collection('users').findOne({ 'email': email })
        if (oldUser.requestResetPasswordId === requestResetPasswordId) {
            const newpassword=Date.now().toString()
            const result = await db.collection('users').updateOne({ '_id': oldUser['_id'] },
                { $set: { 'password': newpassword }, $unset: { 'requestResetPasswordId': 1 } });
            res.send(`<h2 style="text-align:center;color:green"> Your password was reset. new password:<h2> <h2 style="text-align:center;color:blue">${newpassword}<h2>`)
        }

    } catch (error) {
        res.status(400).send('Invalid request');

    }
});


app.post('/Identity/Account/Manage', async (req, res) => {
    try {
        console.log('rec received 2')
        console.log(req.body)
        var name = req.body["Input.Name"]
        var tiktok = req.body["Input.Tiktok"] ?? ''
        var facebook = req.body["Input.facebook"] ?? ''
        var instagram = req.body["Input.Instagram"] ?? ''
        var twitter = req.body["Input.Twitter"] ?? ''

        let user = JSON.parse(req.cookies.user)
        if (user) {
            console.log({ name, instagram, tiktok, facebook, twitter })
            var requestEmailChangeId = Date.now().toString()
            var jsonData
            if (name !== user.name) {
                jsonData = { name, instagram, tiktok, facebook, twitter }
            } else {
                jsonData = { instagram, tiktok, facebook, twitter }
            }

            const result = await db.collection('users').updateOne({ '_id': user['_id'] }, { $set: jsonData });
            user.name = name
            user.tiktok = tiktok
            user.facebook = facebook
            user.instagram = instagram
            user.twitter = twitter
            res.cookie('user', JSON.stringify(user));

            res.send('<h2 style="text-align:center;color:green">Congrats! Your profile info was changed<h2>')
        }
    } catch (error) {
        console.log(error)
        res.status(400).send('Invalid request');
    }

});

app.get('/Identity/Account/Manage/ChangePassword/VerifyChange', async (req, res) => {

    var uid = req.query.uid
    var requestPasswordChangeId = req.query.requestPasswordChangeId
    try {
        var oldUser = await db.collection('users').findOne({ '_id': uid })
        if (oldUser.requestPasswordChangeId === requestPasswordChangeId) {

            const result = await db.collection('users').updateOne({ '_id': uid },
                { $set: { 'password': oldUser.requestPasswordChangeId.newpassword }, $unset: { 'requestPasswordChangeId': 1 } });
            res.send('<h2 style="text-align:center;color:green">Congrats! Your email was changed<h2>')
        }

    } catch (error) {
        res.status(400).send('Invalid request');

    }
});

app.post('/Identity/Account/Manage/ChangePasswordRequest', async (req, res) => {
    //TODO:
    console.log('rec received to ChangePasswordRequest')
    try {

        console.log(req.body)
        var newpassword = req.body['Input.NewPassword']
        var password = req.body['Input.OldPassword']
        let user = JSON.parse(req.cookies.user)

        if (user.password === password) {
            console.log({ password, newpassword })
            var requestPasswordChangeId = Date.now().toString()
            const result = await db.collection('users').updateOne({ '_id': user['_id'] },
                { $set: { 'requestPasswordChange': { 'id': requestPasswordChangeId, 'newpassword': newpassword } } });
            var confirmationurl = req.hostname + `/Identity/Account/Manage/ChangePassword/VerifyChange?uid=${user['_id']}&requestEmailChangeId=${requestPasswordChangeId}`
            console.log('confirmationurl', confirmationurl)

            console.log('//TODO: Send email with that url')
            res.send('<h2 style="text-align:center;color:green">Confirmation Request to change password was sent to your email<h2>')

        }
    } catch (error) {
        console.log(error)
        res.status(400).send('Invalid request');
    }



});

app.post('/Helpers/ImageHelper/', upload.single('image'), async (req, res) => {
    console.log('calling imagehelper')
    console.log(req.cookies)
    let user = JSON.parse(req.cookies.user)
    console.log(user)
    try {
        var userId = user['_id']
        if (userId && req.query.handler === 'SaveToServer') {
            const imageType = req.query.imageType;
            const projectid = req.query.projectid;
            const imageData = req.file;
            if (imageType === 'OG') {
                user = await createNewProject(user, userId, projectid);
            }
            console.log(req.query)


            // console.log('.......///////////..........',imageData)

            const fileName = `${imageType}.png`; // generate a unique file name
            const filePath = `./Uploads/${userId}/${projectid}/${fileName}`;
            fs.writeFileSync(filePath, imageData.buffer);
            console.log(user)
            res.cookie('user', JSON.stringify(user));
        }
    } catch (error) {
        console.log(error)
        res.status(400).send('Invalid request');
    }
});



app.listen(80)

async function createNewProject(user, userId, pid) {


    try {



        fs.mkdirSync(`Uploads/${userId}/${pid}`);
        //TODO create data.json {name}
        var dataPath = `Uploads/${userId}/${pid}/data.json`

        fs.writeFileSync(dataPath, JSON.stringify({ 'name': pid }));
        return user
    } catch (error) {
        console.error(error);
    }
}


function forgotPasswordResetRequest(req) {
    //email=req.email
    //if email exists in mongo.users
    //send email with link /passwordReset?uid=,newpass= 
}
function resetUserPassword(req) {
    //uid=req.uid
    //get user
    //user.password=req.newpassword
    //set user
}


async function requestEmailChange(uid, email, newemail) {

}
function requestPasswordChange(req) {
    // const userId = req.cookies.userId;
    // const newEmail = req.body['Input.NewEmail'];
}
function verifyEmailChangeRequest(req) {

    // const userId = req.cookies.userId;
    //get user
    // const newPassword = req.body['Input.NewPassword'];
    // const oldPassword = req.body['Input.OldPassword'];
    //if oldPassword === user.password
    //create passwordChangeRequest{id, newpassword}
    //send email with userid & passwordChangeRequest.id to verify

    return true;
}
function verifyPasswordChangeRequest(req) {
    // const newPassId = req.param.passwordChangeRequestId;
    // const userId = req.param.userid;
    //get user 
    //update user with new pass , remove passChange request
    //set user to db
    res.send('password changed successfully')

}

