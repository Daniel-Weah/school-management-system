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
 if (e.ctrlKey & e.key === '/') {
  e.preventDefault();
  document.getElementById('search').focus();
 }
});
 