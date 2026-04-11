const registerForm = document.querySelector("#register-form");
const checkContentSafe = async (text) => {
    const viBadWordsRegex = /địt|đm|vcl|vkl|đéo|cặc|lồn|buồi|óc chó|ngu lồn|mẹ mày|tổ sư|vãi/i;
    if (viBadWordsRegex.test(text)) return false;
    try {
        const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`);
        const isProfane = await response.text();
        return isProfane !== "true";
    } catch (err) { return true; }
};

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

registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.querySelector("#username").value.trim();
    const password = document.querySelector("#password").value;
    const confirmPassword = document.querySelector("#confirm-password").value;
    if (password !== confirmPassword) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Passwords do not match!' });
        return;
    }
    Swal.fire({
        title: 'Checking username...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const isSafe = await checkContentSafe(username);
    if (!isSafe) {
        Swal.fire({
            icon: 'error',
             malice: 'Warning',
            title: 'Inappropriate Username',
            text: 'Please choose a more polite username!'
        });
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