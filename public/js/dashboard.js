// Load Google Charts
google.charts.load('current', {'packages':['bar']});

// First chart: Grades report
google.charts.setOnLoadCallback(drawGradesChart);

function drawGradesChart() {
  var data = google.visualization.arrayToDataTable([
    ['Period', 'Maths', 'English', 'Bio.', 'Chem.', 'Phy.', 'Eco.', 'Geo.', 'Hist.','Lit.'],
    ['1st', 90, 60, 72, 70, 80, 65, 71, 64, 70]
  ]);

  var options = {
    chart: {
      title: 'My Grades Report',
      subtitle: 'Representational of subject grades for each period'
    },
    colors: ['#3b5998', '#8b9dc3', '#f39c12', '#e74c3c', '#3498db', '#9b59b6', '#27ae60', '#f1c40f', '#2980b9'] // Darker color palette
  };

  var chart = new google.charts.Bar(document.getElementById('columnchart_grades'));
  chart.draw(data, google.charts.Bar.convertOptions(options));
}

// Load Google Charts for pie chart
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
  var data = google.visualization.arrayToDataTable([
    ['Period', 'Hours per Day'],
    ['Maths', 90],
    ['English', 60],
    ['Bio.', 72],
    ['Chem.', 70],
    ['Phy.', 80],
    ['Eco.', 65],
    ['Geo.', 71],
    ['Hist.', 64],
    ['Lit.', 70]
  ]);

  var options = {
    title: 'My Grades Report',
    colors: ['#2980b9', '#e74c3c', '#f39c12', '#8e44ad', '#27ae60', '#3498db', '#c0392b', '#9b59b6', '#f1c40f'] // Adjusted color scheme
  };

  var chart = new google.visualization.PieChart(document.getElementById('piechart'));
  chart.draw(data, options);
}

// ================================================== TEACHERS AND ADMIN ===========================

google.charts.setOnLoadCallback(drawPerformanceChart);

function drawPerformanceChart() {
  var data = google.visualization.arrayToDataTable([
    ['Period', 'Passed', 'Failed'],
    ['1st', 34, 12]
  ]);

  var options = {
    chart: {
      title: 'Student Performance',
      subtitle: 'Student performance for each period.'
    },
    colors: ['#2ecc71', '#e74c3c'] // Darker green for passed, red for failed
  };

  var chart = new google.charts.Bar(document.getElementById('columnchart_performance'));
  chart.draw(data, google.charts.Bar.convertOptions(options));
}

// Teachers and Admin pie chart
google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(drawPiePerformanceChart);

function drawPiePerformanceChart() {
  var data = google.visualization.arrayToDataTable([
    ['Result', 'Number of Students'],
    ['Passed', 34],
    ['Failed', 12]
  ]);

  var options = {
    title: 'Student Performance',
    colors: ['#2ecc71', '#e74c3c'] // Consistent color scheme for pass/fail
  };

  var chart = new google.visualization.PieChart(document.getElementById('piechart_performance'));
  chart.draw(data, options);
}


// ============= crtl + / short cut key for the search box

document.addEventListener('keydown', (e) => {
 if (e.ctrlKey && e.key === '/') {
  e.preventDefault();
  document.getElementById('search').focus();
 }
});
document.addEventListener('keydown', (e) => {
 if (e.ctrlKey && e.key === '/') {
  e.preventDefault();
  document.getElementById('teacher_search').focus();
 }
});
document.addEventListener('keydown', (e) => {
 if (e.ctrlKey && e.key === '/') {
  e.preventDefault();
  document.getElementById('administrator_search').focus();
 }
});
 
// adding the functionality of the all check box
// student all check box
function studentToggleDeleteButton() {
  const deleteButton = document.querySelector('.delete_btn');
  const studentCheckboxes = document.querySelectorAll('.student-checkbox');
  const anyChecked = Array.from(studentCheckboxes).some(checkbox => checkbox.checked);

  deleteButton.style.display = anyChecked ? 'inline-block' : 'none'; // Toggle button
}

// Function to toggle delete button for instructors
function teacherToggleDeleteButton() {
  const deleteButton = document.querySelector('.instructor_delete_btn');
  const instructorCheckboxes = document.querySelectorAll('.instructor-checkbox');
  const anyChecked = Array.from(instructorCheckboxes).some(checkbox => checkbox.checked);

  deleteButton.style.display = anyChecked ? 'inline-block' : 'none'; // Toggle button
}

// Function to toggle delete button for administrators
function administratorToggleDeleteButton() {
  const deleteButton = document.querySelector('.administrator_delete_btn');
  const administratorCheckboxes = document.querySelectorAll('.administrator-checkbox');
  const anyChecked = Array.from(administratorCheckboxes).some(checkbox => checkbox.checked);

  deleteButton.style.display = anyChecked ? 'inline-block' : 'none'; // Toggle button
}

// Students "check all" checkbox event listener
document.getElementById('checkAllStudents').addEventListener('change', function () {
  let checkboxes = document.querySelectorAll('#students .student-checkbox');
  checkboxes.forEach(checkbox => checkbox.checked = this.checked);
  studentToggleDeleteButton(); // Call toggle function for students
});

// Teachers "check all" checkbox event listener
document.getElementById('checkAllInstructors').addEventListener('change', function () {
  let checkboxes = document.querySelectorAll('#instructors .instructor-checkbox');
  checkboxes.forEach(checkbox => checkbox.checked = this.checked);
  teacherToggleDeleteButton(); // Call toggle function for instructors
});

// Administrators "check all" checkbox event listener
document.getElementById('checkAllAdministrators').addEventListener('change', function () {
  let checkboxes = document.querySelectorAll('#administrators .administrator-checkbox');
  checkboxes.forEach(checkbox => checkbox.checked = this.checked);
  administratorToggleDeleteButton(); // Call toggle function for administrators
});

// Add event listeners to individual student checkboxes
document.querySelectorAll('.student-checkbox').forEach(function (checkbox) {
  checkbox.addEventListener('change', studentToggleDeleteButton);
});

// Add event listeners to individual instructor checkboxes
document.querySelectorAll('.instructor-checkbox').forEach(function (checkbox) {
  checkbox.addEventListener('change', teacherToggleDeleteButton);
});

// Add event listeners to individual administrator checkboxes
document.querySelectorAll('.administrator-checkbox').forEach(function (checkbox) {
  checkbox.addEventListener('change', administratorToggleDeleteButton);
});

// Function to filter table rows based on search input
function filterTable(searchInput, tableBody) {
  const filter = searchInput.value.toLowerCase();
  const rows = tableBody.getElementsByTagName('tr');
  
  Array.from(rows).forEach(row => {
    const cells = row.getElementsByTagName('td');
    let match = false;

    // Loop through each cell in the row
    Array.from(cells).forEach(cell => {
      if (cell.textContent.toLowerCase().includes(filter)) {
        match = true;
      }
    });

    // Toggle the display of the row based on match
    row.style.display = match ? '' : 'none';
  });
}

// Students Tab
const studentSearchInput = document.getElementById('search');
const studentTableBody = document.querySelector('#students tbody');
studentSearchInput.addEventListener('input', () => filterTable(studentSearchInput, studentTableBody));

// Instructors Tab
const instructorSearchInput = document.getElementById('teacher_search');
const instructorTableBody = document.querySelector('#instructors tbody');
instructorSearchInput.addEventListener('input', () => filterTable(instructorSearchInput, instructorTableBody));

// Administrators Tab
const adminSearchInput = document.getElementById('administrator_search');
const adminTableBody = document.querySelector('#administrators tbody');
adminSearchInput.addEventListener('input', () => filterTable(adminSearchInput, adminTableBody));

// Keyboard Shortcut (Ctrl + /) for focusing search inputs
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();

    // Find the active tab and focus its search input
    if (document.getElementById('students-tab').classList.contains('active')) {
      studentSearchInput.focus();
    } else if (document.getElementById('instructors-tab').classList.contains('active')) {
      instructorSearchInput.focus();
    } else if (document.getElementById('administrators-tab').classList.contains('active')) {
      adminSearchInput.focus();
    }
  }
});
