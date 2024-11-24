document.addEventListener('DOMContentLoaded', () => {
    const currentYear = new Date().getFullYear();
    document.getElementById('year').textContent = currentYear;

    populateYearDropdown('year');
    initializeEventListeners();
});

// Function to populate dropdown
function populateYearDropdown(selectElementId, startYear = 1990) {
    const selectElement = document.getElementById(selectElementId);
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.text = year;
        selectElement.appendChild(option);
    }
}

// Initialize all event listeners
function initializeEventListeners() {
    document.getElementById('feedbackForm').addEventListener('submit', handleFeedbackForm);
    document.getElementById('transcriptForm').addEventListener('submit', handleTranscriptForm);
    const bwsmsBtn = document.getElementById("bwsms_btn");
    bwsmsBtn?.addEventListener("click", () => {
        showAlert('Hey!', 'Welcome to BWSMS!, Discover our features and streamline school management today.', 'info', '5000');
    });
}

// Form Handlers
function handleFeedbackForm(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true; // Disable the submit button

    if (!validateEmail(email)) {
        showAlert('Error!', 'Please enter a valid email address.', 'error');
        submitButton.disabled = false; // Re-enable the button on validation failure
        return;
    }

    fetch('/feedback', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                showAlert('Success!', 'Feedback sent successfully!', 'success');
                e.target.reset(); // Reset the form on success
            } else {
                showAlert('Error', 'An error occurred in sending your feedback.', 'error');
            }
        })
        .catch(error => {
            showAlert('Error', 'There was a problem sending your feedback. Please try again later.', 'error');
            console.error('Error:', error);
        })
        .finally(() => {
            submitButton.disabled = false; // Re-enable the button after completion
        });
}

function handleTranscriptForm(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true; // Disable the submit button

    fetch('/request-transcript', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                showAlert('Success!', data.message, 'success');
                e.target.reset(); // Reset the form on success
            } else {
                showAlert('Error', data.message, 'error');
            }
        })
        .catch(error => {
            showAlert('Error', 'There was a problem sending your request. Please try again later.', 'error');
            console.error('Error:', error);
        })
        .finally(() => {
            submitButton.disabled = false; // Re-enable the button after completion
        });
}

// Utility functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function showAlert(title, text, icon, timer = 2000) {
    Swal.fire({
        title,
        text,
        icon,
        showConfirmButton: false,
        timer
    });
}
