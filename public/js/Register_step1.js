const registerForm = document.querySelector("#register-form");
document.querySelectorAll('.btn-toggle').forEach(icon => {
    icon.addEventListener('click', function () {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input.type === 'password') {
            input.type = 'text';
            this.classList.replace('bi-eye-slash', 'bi-eye');
        } else {
            input.type = 'password';
            this.classList.replace('bi-eye', 'bi-eye-slash');
        }
    });
});

registerForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.querySelector("#username").value.trim();
    const password = document.querySelector("#password").value;
    const confirmPassword = document.querySelector("#confirm-password").value;

    if (password !== confirmPassword) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Passwords do not match!' });
        return;
    }
    sessionStorage.setItem('temp_username', username);
    sessionStorage.setItem('temp_password', password);

    Swal.fire({
        icon: 'success',
        title: 'Step 1 Complete!',
        text: 'Proceeding to Email Verification...',
        timer: 1500,
        showConfirmButton: false
    });

    setTimeout(() => {
        window.location.href = "Register_step2.html";
    }, 1500);
});