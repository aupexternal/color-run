// COLOR RUN - Google Apps Script Integration & Form Handler

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxgXtN_E61tmHmnSx6znpwL6eknWomByuTfZcduRCMUx-U_qMiZ2pQSEVQQNllaZ7XT/exec';
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

    fetch(WEB_APP_URL, {
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
```[cite: 1, 2, 3]

---

### 2. Google Apps Script Backend (`Code.gs`)

Open your connected Google Sheet, go to **Extensions > Apps Script**, paste the code below into `Code.gs`, and click **Deploy > New deployment** (select type **Web app**, set execute as **Me**, and who has access to **Anyone**).

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // 1. Get active spreadsheet and sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // If the sheet is empty, add header row automatically
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Full Name", "Email", "Phone", "Category", "Receipt Link", "Status"]);
    }
    
    var fileUrl = "No Receipt Uploaded";
    
    // 2. Handle Base64 file upload to Google Drive
    if (data.fileData) {
      // Optional: Specify a folder ID where receipts should be saved. 
      // If left blank, it saves in your Google Drive root folder.
      var folderId = ""; 
      var folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
      
      var base64Content = data.fileData.split(',')[1];
      var blob = Utilities.newBlob(
        Utilities.base64Decode(base64Content), 
        data.mimeType, 
        data.fileName
      );
      
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
    }
    
    // 3. Append registration row to Google Sheet
    sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.phone,
      data.category,
      fileUrl,
      "Pending Verification"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Color Run Web App is active and running!");
}
