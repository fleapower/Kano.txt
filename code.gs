function doGet() {
  try {
    // Try to get a valid file ID
    const fileId = getStoredFileId();
    if (!fileId || !validateFileId(fileId)) {
      // If no valid file ID, return the prompt page
      return HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
          <head>
            <base target="_top">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; }
              input { width: 100%; padding: 8px; margin: 10px 0; }
              button { padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; }
              .error { color: red; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Task File Setup</h2>
              <p>Please enter the Google Drive File ID for your task file:</p>
              <input type="text" id="fileId" placeholder="Enter File ID">
              <div id="error" class="error"></div>
              <button onclick="submitFileId()">Save</button>
              <button onclick="clearFileId()">Clear File ID</button>
            </div>
            <script>
              function submitFileId() {
                const fileId = document.getElementById('fileId').value.trim();
                if (!fileId) {
                  document.getElementById('error').textContent = 'Please enter a File ID';
                  return;
                }
                google.script.run
                  .withSuccessHandler(function(success) {
                    if (success) {
                      // Use top-level navigation to force a complete reload
                      google.script.host.close();
                      window.top.location.href = window.top.location.href;
                      
                    } else {
                      document.getElementById('error').textContent = 'Invalid File ID. Please check and try again.';
                    }
                  })
                  .withFailureHandler(function(error) {
                    document.getElementById('error').textContent = 'Error: ' + error.message;
                  })
                  .setupFileId(fileId);
              }

              function clearFileId() {
                google.script.run
                  .withSuccessHandler(function() {
                    google.script.host.close();
                    window.top.location.href = window.top.location.href;
                  })
                  .clearStoredFileId();
              }
            </script>
          </body>
        </html>
      `)
      .setTitle('Setup Task File')
      .setFaviconUrl('https://drive.google.com/uc?export=download&id=1L6RQug6xKYBAE36KeUvNXJ_f6qMasSbI&format=png');
    }
    
    // If we have a valid file ID, return the main app
    return HtmlService.createHtmlOutputFromFile('index')
      .setFaviconUrl('https://drive.google.com/uc?export=download&id=1L6RQug6xKYBAE36KeUvNXJ_f6qMasSbI&format=png');
  } catch (e) {
    // If there's an error, show the error message in a simple page
    return HtmlService.createHtmlOutput(`
      <h2>Error</h2>
      <p>${e.message}</p>
      <button onclick="window.top.location.reload()">Retry</button>
    `);
  }
}

// File ID Management Functions

function clearStoredFileId() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('TODO_FILE_ID');
  return HtmlService.createHtmlOutput(`
    <script>
      window.top.location.reload();
    </script>
  `);
}

function getStoredFileId() {
  const userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty('TODO_FILE_ID');
}

function storeFileId(fileId) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('TODO_FILE_ID', fileId);
}

function validateFileId(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return true;
  } catch (e) {
    return false;
  }
}

function setupFileId(fileId) {
  if (validateFileId(fileId)) {
    storeFileId(fileId);
    return true;
  }
  return false;
}

// Task Management Functions
function getLastModifiedTime() {
  const fileId = getStoredFileId();
  if (!fileId) throw new Error('No file ID configured');
  const file = DriveApp.getFileById(fileId);
  return file.getLastUpdated().getTime();
}

function getTasksAndModifiedTime() {
  const fileId = getStoredFileId();
  if (!fileId) throw new Error('No file ID configured');
  const file = DriveApp.getFileById(fileId);
  return {
    tasks: getTasks(),
    lastModified: file.getLastUpdated().getTime()
  };
}

function getTasks() {
  const fileId = getStoredFileId();
  if (!fileId) throw new Error('No file ID configured');
  const file = DriveApp.getFileById(fileId);
  const content = file.getBlob().getDataAsString();
  const lines = content.split('\n');
  return lines.map((task, index) => ({ TaskID: index, Task: task }));
}

function saveTasksToFile(tasksText) {
  const fileId = getStoredFileId();
  if (!fileId) throw new Error('No file ID configured');
  const file = DriveApp.getFileById(fileId);
  file.setContent(tasksText);
  return file.getLastUpdated().getTime();
}

// Filter Set Management Functions
function getAllFilterSets() {
  const userProperties = PropertiesService.getUserProperties();
  const filterSets = userProperties.getProperty('filterSets');
  return filterSets ? JSON.parse(filterSets) : {};
}

function saveFilterSet(number, filterSet) {
  var fileName = 'filterSet' + number + '.json';
  var file = DriveApp.getFilesByName(fileName);
  if (file.hasNext()) {
    file.next().setContent(JSON.stringify(filterSet));
  } else {
    DriveApp.createFile(fileName, JSON.stringify(filterSet));
  }
}

function saveAllFilterSets(filterSets) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('filterSets', JSON.stringify(filterSets));
}

function loadFilterSet(number) {
  var fileName = 'filterSet' + number + '.json';
  var file = DriveApp.getFilesByName(fileName);
  if (file.hasNext()) {
    var content = file.next().getBlob().getDataAsString();
    return JSON.parse(content);
  } else {
    return null;
  }
}