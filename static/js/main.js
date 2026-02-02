const menuBar = document.getElementById('menu-bar');
const closeBar = document.getElementById('close-bar');
const navMenu = document.querySelector('.navbar-menu');
const navBtn = document.getElementById('nav-btn');
const logo = document.getElementById('logo');

menuBar.addEventListener('click', () => {
    navMenu.style.display = 'flex';
    menuBar.style.display = 'none';
    closeBar.style.display = 'block';
});

closeBar.addEventListener('click', () => {
    navMenu.style.display = 'none';
    menuBar.style.display = 'block';
    closeBar.style.display = 'none';
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        logo.classList.add('hide-logo');
        navBtn.classList.add('show-nav-btn');
    } else {
        logo.classList.remove('hide-logo');
        navBtn.classList.remove('show-nav-btn');
    }
});


