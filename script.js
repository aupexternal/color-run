// COLOR RUN - Google Apps Script Integration & Form Handler

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwf_lMukai8J6wDoRvjJIqZQYB2EnkLY-IrGs8Z-cztYAUBFdcSciF6RMfTqaiqSWpI/exec';
let registrationData = {};

// Auto-select category from URL query parameter if passed from homepage
document.addEventListener("DOMContentLoaded", function() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  if (categoryParam) {
    const categorySelect = document.getElementById('category-select');
    if (categorySelect) {
      categorySelect.value = categoryParam;
    }
  }

  const proceedBtn = document.getElementById("proceed-btn");
  if (proceedBtn) {
    proceedBtn.addEventListener("click", handleStep1Proceed);
  }

  const paymentForm = document.getElementById("payment-form");
  if (paymentForm) {
    paymentForm.addEventListener("submit", handlePaymentSubmit);
  }
});

// Step 1: Validate participant details and transition to Step 2
function handleStep1Proceed() {
  const name = document.getElementById('form-name').value.trim();
  const email = document.getElementById('form-email').value.trim();
  const phone = document.getElementById('form-phone').value.trim();
  const category = document.getElementById('category-select').value;

  if (!name || !email || !phone || !category) {
    alert("Please fill in all participant details before proceeding.");
    return;
  }

  registrationData = { name, email, phone, category };

  document.getElementById('step-1').classList.remove('active');
  document.getElementById('step-2').classList.add('active');
}

// Step 2: Upload receipt image file & send data payload to Google Apps Script
function handlePaymentSubmit(e) {
  e.preventDefault();
  const fileInput = document.getElementById('receipt-file');
  const file = fileInput.files[0];
  const submitBtn = document.getElementById('submit-btn');
  const statusMsg = document.getElementById('status-message');

  if (!file) return alert("Please select a receipt image.");

  submitBtn.disabled = true;
  submitBtn.textContent = "UPLOADING & SUBMITTING...";

  const reader = new FileReader();
  reader.onload = function(evt) {
    registrationData.fileData = evt.target.result;
    registrationData.fileName = file.name;
    registrationData.mimeType = file.type;

    fetch(https://script.google.com/macros/s/AKfycbxgXtN_E61tmHmnSx6znpwL6eknWomByuTfZcduRCMUx-U_qMiZ2pQSEVQQNllaZ7XT/execL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    })
    .then(() => {
      submitBtn.style.display = "none";
      statusMsg.style.display = "block";
      statusMsg.innerHTML = "Registration submitted successfully!<br><br>We are verifying your GCash payment. Once confirmed, your official Race Bib Number will be sent to <strong>" + registrationData.email + "</strong>.";
    })
    .catch(err => {
      console.error(err);
      alert("Error submitting registration. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "SUBMIT RECEIPT FOR VERIFICATION ↗";
    });
  };
  reader.readAsDataURL(file);
}
