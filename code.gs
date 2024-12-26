var FILE_ID = '1BAfmjodr1dTtXRFVwzAKGFJ8VHyq3mAv'; // Replace with your actual file ID

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setFaviconUrl(`https://drive.google.com/uc?export=download&id=1L6RQug6xKYBAE36KeUvNXJ_f6qMasSbI&format=png`)
}

function getLastModifiedTime() {
  const file = DriveApp.getFileById(FILE_ID);
  return file.getLastUpdated().getTime();
}

function getTasksAndModifiedTime() {
  const file = DriveApp.getFileById(FILE_ID);
  return {
    tasks: getTasks(), // Your existing getTasks functionality
    lastModified: file.getLastUpdated().getTime()
  };
}

function getTasks() {
  var file = DriveApp.getFileById(FILE_ID);
  var content = file.getBlob().getDataAsString();
  var lines = content.split('\n');
  var allTasks = lines.map(function(task, index) {
    return { TaskID: index, Task: task };
  });
  return allTasks;
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

function saveTasksToFile(tasksText) {
  const file = DriveApp.getFileById(FILE_ID);
  file.setContent(tasksText);
  return file.getLastUpdated().getTime();
}