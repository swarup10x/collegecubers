// const AdminUsername = 'admin';
// const AdminPassword = 'password';

let admin = JSON.parse(sessionStorage.getItem('admin'));

async function getUsers() {
  const userList = document.getElementById('user-list');
    const response = await fetch('/Admin/Users?username=' + admin.username + '&password=' + admin.password);
    const data = await response.json();
    let listcount = document.getElementById('user-count');
    listcount.textContent=`Users (${data.users?.length})`
    data.users.forEach((user) => {
        const li = document.createElement('li');
        li.setAttribute('class', 'userid');
        
        li.textContent = user.email;
        const userProjects = document.createElement('div');
        userProjects.setAttribute('id', user._id);
        userProjects.setAttribute('class', 'project-header');
        li.addEventListener('click', () => {
            
            li.appendChild(userProjects);
            let projlistelem = document.getElementById(user._id);
            async function getUserProjects(userid) {
                userProjects.textContent = `projects:`;
                const response = await fetch('/Admin/User/Projects?username=' + admin.username + '&password=' + admin.password + '&userid=' + userid);
                const data = await response.json();
                
                
                
                data.projectids.forEach((projectid) => {
                    let li2 = document.createElement('li');
                    li2.setAttribute('id', projectid);
                    li2.setAttribute('class', 'projectid');
                    li2.textContent = projectid;
                    let ul=document.createElement('ul');
                    li2.setAttribute('class', 'projectid-list');
                    
                    ul.appendChild(li2);
                    projlistelem.appendChild(ul);
                    li2.addEventListener('click', () => {
                        modal.style.display = 'block';
                        let title = document.getElementById('modal-title');
                        title.textContent=`${user.name}/${projectid}`
                        let crop = document.getElementById('crop');
                        let paint = document.getElementById('paint');
                        crop.src=`/${user._id}/${projectid}/Crop.png`
                        paint.src=`/${user._id}/${projectid}/Paint.png`

                      });
                });

            }
            if (projlistelem.childElementCount === 0) {

                getUserProjects(user._id);
            }

        });
        userList.appendChild(li);
    });
}





if (admin && admin.username && admin.password) {
  document.getElementById("main").style.display = "block";
    getUsers();
} else {
    const loginForm = document.createElement('form');
    const usernameInput = document.createElement('input');
    const passwordInput = document.createElement('input');
    const loginButton = document.createElement('button');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        sessionStorage.setItem('admin', JSON.stringify({ username, password }));
        admin={ username, password }
        document.body.removeChild(loginForm);
        document.getElementById("main").style.display = "block";
        getUsers();
    });

    usernameInput.setAttribute('type', 'text');
    usernameInput.setAttribute('placeholder', 'Username');
    passwordInput.setAttribute('type', 'password');
    passwordInput.setAttribute('placeholder', 'Password');
    loginButton.innerText = 'Login';

    loginForm.appendChild(usernameInput);
    loginForm.appendChild(passwordInput);
    loginForm.appendChild(loginButton);
    document.body.appendChild(loginForm);
}

const openModalBtn = document.getElementById('open-modal-btn');
const modal = document.createElement('div');

// Set the modal HTML
modal.innerHTML = `
  <div class="modal-overlay">
    <div class="modal">
      <button class="close-btn">&times;</button>
      <h4 id="modal-title">Modal Title</h4>
      <div id="modal-images">
        <img id="crop"/>
        <img id="paint"/>
     
      </div>
    </div>
  </div>
`;

// Hide the modal by default
modal.style.display = 'none';

// Append the modal to the body element
document.body.appendChild(modal);

// Add event listener to open the modal when the button is clicked


// Add event listener to close the modal when the close button is clicked
modal.addEventListener('click', (event) => {
  if (event.target.classList.contains('close-btn')) {
    modal.style.display = 'none';
  }
});