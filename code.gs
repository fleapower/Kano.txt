// Public Release Alpha 0.05

function doGet() {
  try {
    return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setFaviconUrl('https://drive.google.com/uc?export=download&id=1f_VcmveEWFC6-UK6BJVYdVATOkaFzg__&format=png')
      .setTitle('Kano.txt');
  } catch (e) {
    return HtmlService.createHtmlOutput(`
      <h2>Error</h2>
      <p>${e.message}</p>
      <button onclick="window.top.location.reload()">Retry</button>
    `)
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function listTodoFiles() {
  try {
    const files = DriveApp.getFilesByType(MimeType.PLAIN_TEXT);
    const todoFiles = [];

    Logger.log('Started processing files');

    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName().toLowerCase();
      
      Logger.log('Processing file: ' + fileName);

      if (fileName.includes('todo') && fileName.endsWith('.txt')) {
        todoFiles.push({
          id: file.getId(),
          name: file.getName(),
          date: file.getLastUpdated().getTime(), // Convert Date to timestamp
          size: file.getSize()
        });

        Logger.log('Added file: ' + fileName);
      }
    }

    todoFiles.sort((a, b) => b.date - a.date);

    Logger.log(`Found ${todoFiles.length} todo files`);

    todoFiles.forEach(file => {
      Logger.log(`File: ${file.name}, ID: ${file.id}, Last Updated: ${new Date(file.date)}, Size: ${file.size}`);
    });

    return todoFiles;

  } catch (error) {
    Logger.log('Error in listTodoFiles: ' + error.toString());
    throw new Error('Failed to list todo files: ' + error.message);
  }
}

function createNewTodoFile(fileName) {
  try {
    const file = DriveApp.createFile(fileName, '', 'text/plain');
    const fileId = file.getId();
    PropertiesService.getUserProperties().setProperty('TODO_FILE_ID', fileId);
    return fileId;
  } catch (error) {
    Logger.log('Error creating new todo file: ' + error.toString());
    return null;
  }
}

// File ID Management Functions

function clearStoredFileId() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('TODO_FILE_ID');
  return true;
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

function getHelpContent() {
  try {
    return HtmlService.createHtmlOutputFromFile('help').getContent();
  } catch (e) {
    console.error('Error loading help content:', e);
    return 'Error loading help content. Please make sure help.html exists in the project.';
  }
}